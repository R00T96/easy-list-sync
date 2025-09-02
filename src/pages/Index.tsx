import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Cloud, History, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadItems, saveItems, type ShoppingItem, type SyncStatus } from "@/store/shoppingList";
import { createSupabaseWithHeaders, supabase } from "@/integrations/supabase/client";
import { PinGate } from "@/components/PinGate";
import type { RealtimeChannel } from "@supabase/supabase-js";

const Index = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [text, setText] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const PENDING: SyncStatus = "pending";
  const [isSyncing, setIsSyncing] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const isHandlingRealtimeUpdate = useRef(false);
  
  // Client ID for preventing self-echo
  const clientId = useRef(localStorage.getItem("client-id") || crypto.randomUUID());
  useEffect(() => { 
    localStorage.setItem("client-id", clientId.current); 
  }, []);
  
  // Refs for stable access to current state in callbacks
  const itemsRef = useRef<ShoppingItem[]>([]);
  const isSyncingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);

  // SEO
  useEffect(() => {
    const title = pin ? `Group Checklist — Room ${pin}` : "Group Checklist — Plan it in minutes, live it for hours";
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Get 10+ brains on the same page in 10 seconds. No login, instant link share, works on any device.");
  }, [pin]);

  // Helper to merge a single server row into local state safely
  const upsertFromServer = useCallback((row: any) => {
    if (!row || row.list_id !== pin) return;
    
    // Ignore self-echo events
    if (row.client_id === clientId.current) {
      console.log('🔄 Ignoring self-echo event:', row.text);
      return;
    }

    // Normalize to ShoppingItem
    const serverItem: ShoppingItem = {
      id: String(row.id),
      list_id: String(row.list_id),
      text: String(row.text),
      qty: Number(row.qty),
      done: Boolean(row.done),
      updated_at: new Date(String(row.updated_at)).toISOString(),
      deleted: Boolean(row.deleted),
      syncStatus: "synced",
    };

    // Find local item
    const local = itemsRef.current;
    const idx = local.findIndex(i => i.id === serverItem.id);

    // If we have a local pending edit that is newer, keep local and skip
    if (idx >= 0) {
      const li = local[idx];
      const localIsPending = li.syncStatus === PENDING;
      const serverTime = new Date(serverItem.updated_at).getTime();
      const localTime = new Date(li.updated_at).getTime();

      if (localIsPending && localTime >= serverTime) {
        // We have a more recent or equal local change; do nothing
        console.log('🔄 Keeping newer local change:', li.text);
        return;
      }
    }

    // Apply server change
    let next: ShoppingItem[];
    if (idx === -1) {
      next = [serverItem, ...local];
      console.log('➕ Applied server INSERT:', serverItem.text);
    } else {
      next = [...local];
      next[idx] = { ...serverItem, syncStatus: "synced" };
      console.log('🔄 Applied server UPDATE:', serverItem.text);
    }

    applyItems(next);
  }, [pin]);

  // Handle server deletes
  const applyServerDelete = useCallback((row: any) => {
    if (!row || row.list_id !== pin) return;
    
    const local = itemsRef.current;
    const idx = local.findIndex(i => i.id === String(row.id));
    if (idx === -1) return;

    const next = [...local];
    next[idx] = { ...next[idx], deleted: true, syncStatus: "synced", updated_at: new Date().toISOString() };
    applyItems(next);
    console.log('🗑️ Applied server DELETE:', row.text || row.id);
  }, [pin]);

  // Setup realtime subscription with stable callbacks
  const setupRealtimeSubscription = useCallback(() => {
    if (!pin || realtimeChannel.current) return;

    console.log(`🔄 Setting up realtime subscription for PIN: ${pin}`);
    
    realtimeChannel.current = supabase
      .channel(`shopping_items_${pin}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${pin}`
        },
        (payload) => {
          console.log('📡 Realtime update received:', payload.eventType, payload);
          
          // Fast-path: apply payloads directly to UI
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertFromServer(payload.new);
            return;
          }
          
          if (payload.eventType === 'DELETE') {
            applyServerDelete(payload.old);
            return;
          }

          // Fallback: for unknown cases, guarded sync
          if (!isSyncingRef.current && !isHandlingRealtimeUpdate.current) {
            console.log('🔄 Fallback sync for unknown event type');
            isHandlingRealtimeUpdate.current = true;
            setTimeout(async () => {
              await syncNow();
              isHandlingRealtimeUpdate.current = false;
            }, 200);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          // Lightweight catch-up sync on reconnect
          setTimeout(() => syncNow(), 500);
        }
      });
  }, [pin, upsertFromServer, applyServerDelete]);

  // Cleanup realtime subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (realtimeChannel.current) {
      console.log('🧹 Cleaning up realtime subscription');
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
  }, []);

  useEffect(() => {
    setItems(loadItems());
    const storedPin = localStorage.getItem("shopping-pin");
    if (storedPin) {
      setPin(storedPin);
      // Auto-sync when component loads with existing PIN
      if (navigator.onLine) {
        setTimeout(() => {
          syncNow();
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    if (pin) {
      setupRealtimeSubscription();
    } else {
      cleanupRealtimeSubscription();
    }

    return () => {
      cleanupRealtimeSubscription();
    };
  }, [pin, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Safety cleanup on unmount
  useEffect(() => () => cleanupRealtimeSubscription(), [cleanupRealtimeSubscription]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync when coming back online if there are pending changes
  useEffect(() => {
    if (!isOnline || !pin) return;
    
    const hasPendingItems = itemsRef.current.some(i => 
      i.syncStatus === PENDING && i.list_id === pin
    );
    
    if (hasPendingItems) {
      setTimeout(() => {
        syncNow();
      }, 0);
    }
  }, [isOnline, pin]);

  const visibleItems = useMemo(
    () => {
      if (!pin) return [];
      return showAllItems 
        ? items.filter(i => i.list_id === pin)
        : items.filter(i => !i.deleted && i.list_id === pin);
    },
    [items, pin, showAllItems]
  );
  const allRoomItems = useMemo(() => pin ? items.filter(i => i.list_id === pin) : [], [items, pin]);
  const completedCount = useMemo(() => visibleItems.filter(i => i.done && !i.deleted).length, [visibleItems]);

  // Centralized function to update items, refs, and persistence
  const applyItems = (next: ShoppingItem[]) => {
    itemsRef.current = next;  // Update ref first
    setItems(next);           // Schedule state update
    saveItems(next);          // Persist to storage
  };

  const handlePinSet = (p: string) => {
    cleanupRealtimeSubscription(); // Cleanup old subscription first
    setPin(p);
    localStorage.setItem("shopping-pin", p);
    // Auto-sync when PIN is set to load existing data
    setTimeout(() => {
      syncNow();
    }, 100);
  };
  const clearPin = () => {
    cleanupRealtimeSubscription();
    localStorage.removeItem("shopping-pin");
    setPin(null);
  };

  const addItem = () => {
    if (!pin) {
      toast({ title: "Join Room", description: "Please join a room to add items." });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: ShoppingItem = {
      id: crypto.randomUUID(),
      list_id: pin,
      text: trimmed,
      qty: Math.max(1, qty || 1),
      done: false,
      updated_at: new Date().toISOString(),
      deleted: false,
      syncStatus: PENDING,
      client_id: clientId.current,
    };
    const updated = [next, ...itemsRef.current];
    applyItems(updated);
    setText("");
    setQty(1);
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const toggleDone = (id: string) => {
    const updated = itemsRef.current.map(i => i.id === id ? { ...i, done: !i.done, updated_at: new Date().toISOString(), syncStatus: PENDING } : i);
    applyItems(updated);
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const updateQty = (id: string, delta: number) => {
    const updated = itemsRef.current.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty, updated_at: new Date().toISOString(), syncStatus: PENDING };
      }
      return i;
    });
    applyItems(updated);
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const clearCompleted = () => {
    if (completedCount === 0 || !pin) return;
    const updated = itemsRef.current.map(i => (i.list_id === pin && i.done && !i.deleted) ? { ...i, deleted: true, updated_at: new Date().toISOString(), syncStatus: PENDING } : i);
    applyItems(updated);
    toast({ title: "Progress cleared!", description: "Completed items cleared — everyone will see the update." });
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const restoreItem = (id: string) => {
    const updated = itemsRef.current.map(i => 
      i.id === id ? { 
        ...i, 
        deleted: false, 
        done: false, 
        updated_at: new Date().toISOString(), 
        syncStatus: PENDING 
      } : i
    );
    applyItems(updated);
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const syncNow = async (snapshot?: ShoppingItem[]) => {
    if (!isOnline) {
      toast({ title: "Working offline", description: "Your changes are saved — they'll sync when you're back online." });
      return;
    }
    if (!pin) {
      toast({ title: "Join Room", description: "Join a room to sync progress." });
      return;
    }
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;  // Set ref guard first
    setIsSyncing(true);
    
    console.log(`🔄 Starting sync for PIN ${pin}...`);
    
    try {
      const sb = createSupabaseWithHeaders({ "x-list-id": pin });
      
      // Use the freshest snapshot (passed in or from ref)
      const local = (snapshot ?? itemsRef.current).filter(i => i.list_id === pin);
      const pending = local.filter(i => i.syncStatus === PENDING);

      console.log(`📱 Local items: ${local.length}, Pending: ${pending.length}`);

      // Push pending changes first
    if (pending.length > 0) {
      console.log(`📤 Pushing ${pending.length} pending items:`, pending.map(p => p.text));
      const toPush = pending.map(({ syncStatus, ...rest }) => ({ ...rest, client_id: clientId.current }));
      const { data: upsertData, error: upsertError } = await sb
        .from("shopping_items")
        .upsert(toPush, { onConflict: "id" })
        .select();
        
        if (upsertError) {
          console.error("❌ Upsert error:", upsertError);
          throw upsertError;
        }
        console.log(`✅ Successfully pushed items:`, upsertData);
      }

      // Fetch server items filtered by list_id
      const { data: serverItems, error } = await sb
        .from("shopping_items")
        .select("*")
        .eq("list_id", pin);
      
      if (error) {
        console.error("❌ Fetch error:", error);
        throw error;
      }

      console.log(`📥 Server items: ${serverItems?.length || 0}`);

      // Start with local items (including just-pushed changes)
      const byId = new Map<string, ShoppingItem>();
      
      // First add all local items, marking previously pending ones as synced
      for (const li of local) {
        const wasPending = pending.some(p => p.id === li.id);
        byId.set(li.id, { ...li, syncStatus: wasPending ? "synced" : li.syncStatus });
      }
      
      // Then merge server items, but only if they're not items we just pushed
      const justPushedIds = new Set(pending.map(p => p.id));
      for (const si of serverItems ?? []) {
        const serverItem: ShoppingItem = {
          id: String(si.id),
          list_id: String(si.list_id),
          text: String(si.text),
          qty: Number(si.qty),
          done: Boolean(si.done),
          updated_at: new Date(String(si.updated_at)).toISOString(),
          deleted: Boolean(si.deleted),
          syncStatus: "synced",
        };
        
        const localItem = byId.get(serverItem.id);
        
        if (!localItem) {
          // New item from server
          byId.set(serverItem.id, serverItem);
        } else if (!justPushedIds.has(serverItem.id)) {
          // Only apply conflict resolution if this wasn't a just-pushed item
          const serverTime = new Date(serverItem.updated_at).getTime();
          const localTime = new Date(localItem.updated_at).getTime();
          
          if (serverTime > localTime) {
            console.log(`🔄 Server wins for item: ${serverItem.text}`);
            byId.set(serverItem.id, serverItem);
          } else if (localItem.syncStatus === PENDING) {
            // Local change is newer, push it
            console.log(`📤 Pushing newer local change: ${localItem.text}`);
            const { syncStatus, ...payload } = localItem as any;
            await sb.from("shopping_items").upsert([payload], { onConflict: "id" });
            byId.set(serverItem.id, { ...localItem, syncStatus: "synced" });
          }
        } else {
          console.log(`✅ Keeping just-pushed item: ${localItem.text}`);
        }
      }

      const mergedForPin = Array.from(byId.values()).map(i => ({ ...i, syncStatus: "synced" as SyncStatus }));
      const others = (snapshot ?? itemsRef.current).filter(i => i.list_id !== pin);
      const merged = [...mergedForPin, ...others];
      
      console.log(`🔄 Final merged items for PIN ${pin}: ${mergedForPin.length}`);
      
      // Commit merge to both ref and state synchronously
      itemsRef.current = merged;
      setItems(merged);
      saveItems(merged);
      
      toast({ title: "✨ Everyone's in sync!", description: `${pending.length} updates shared, ${mergedForPin.length} items live.` });
    } catch (e: any) {
      console.error("❌ Sync failed:", e);
      toast({ title: "Sync failed", description: e?.message || "Please try again." });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  const requestSync = () => {
    if (!isOnline) {
      toast({ title: "Working offline", description: "Your changes are saved — they'll sync when you're back online." });
      return;
    }
    syncNow();
  };

  // PIN gate UI
  if (!pin) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container px-4 py-4 flex items-center justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Our List</h1>
            <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Live" : "Offline"}</Badge>
          </div>
        </header>
        <main className="container px-4 py-6 sm:py-10">
          <PinGate onPinSet={handlePinSet} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Our shared list</h1>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Live" : "Offline"}</Badge>
            <span className="text-sm text-muted-foreground">Room: {pin}</span>
            <Button variant="ghost" size="sm" onClick={clearPin} aria-label="Change Room">Switch</Button>
            <Button variant="secondary" size="sm" onClick={requestSync} disabled={!isOnline || isSyncing} aria-label="Sync progress" aria-busy={isSyncing}>
              <Cloud className="mr-2 h-4 w-4" /> Sync
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 sm:py-10">
        <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle id="list-heading">
                Just type. Hit add. Everyone sees it live.
              </CardTitle>
              <CardDescription id="list-description">
                Tap [✓] when it’s done — no repeats, no missed items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Inline guidance banner for new users */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted">
                <p className="text-sm text-muted-foreground">
                  💡 <b>Stuck?</b> Try groceries, chores, party prep, trip plans, to-dos, errands…
                </p>
              </div>
              <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-stretch">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add something for the crew…"
                  aria-label="Item name"
                  onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
                  className="w-full"
                  autoComplete="off"
                  enterKeyHint="done"
                />
                <Button onClick={addItem} aria-label="Add item" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="text-sm"
                >
                  <History className="mr-2 h-4 w-4" />
                  {showAllItems ? "Show Active Only" : "View All Items"}
                </Button>
                {showAllItems && (
                  <p className="text-xs text-muted-foreground">
                    Showing {allRoomItems.length} total items
                  </p>
                )}
              </div>

              <ul className="space-y-3">
                {visibleItems.length === 0 && (
                  <li className="text-muted-foreground text-sm">Your list is empty. Add your first item!</li>
                )}
                 {visibleItems.map((item) => (
                   <li key={item.id} className={`flex items-center justify-between p-3 rounded-md border ${item.deleted ? 'opacity-60 bg-muted/30' : ''}`}>
                     <div className="flex items-center gap-3">
                       {!item.deleted && (
                         <Checkbox checked={item.done} onCheckedChange={() => toggleDone(item.id)} aria-label={`Toggle ${item.text}`} />
                       )}
                       <div>
                         <p className={`font-medium leading-none ${item.deleted ? 'line-through' : ''}`}>
                           {item.text}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           Qty: {item.qty} {item.deleted && '• Removed'}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       {item.deleted ? (
                         <Button variant="outline" size="sm" onClick={() => restoreItem(item.id)} aria-label="Add back to list">
                           <RotateCcw className="mr-1 h-3 w-3" />
                           Add Back
                         </Button>
                       ) : (
                         <>
                           <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">-</Button>
                           <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, +1)} aria-label="Increase quantity">+</Button>
                         </>
                       )}
                     </div>
                   </li>
                 ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Done: {completedCount} — {completedCount > 0 ? "Keep going!" : "Keep going"}
                </p>
                <Button variant="destructive" onClick={clearCompleted} disabled={completedCount === 0} aria-label="Clear completed" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear completed
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
