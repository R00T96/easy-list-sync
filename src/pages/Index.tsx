import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Cloud } from "lucide-react";
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
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const isHandlingRealtimeUpdate = useRef(false);
  
  // Refs for stable access to current state in callbacks
  const itemsRef = useRef<ShoppingItem[]>([]);
  const isSyncingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);

  // SEO
  useEffect(() => {
    const title = pin ? `Shopping List — PIN ${pin}` : "Offline Shopping List — Sync Ready";
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Simple offline-first shopping list with PIN-based shared sync.");
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
          if (isHandlingRealtimeUpdate.current || isSyncingRef.current) {
            console.log('⏭️ Skipping realtime update (currently syncing or handling update)');
            return;
          }
          
          console.log('📡 Realtime update received:', payload);
          isHandlingRealtimeUpdate.current = true;
          
          // Only sync if we don't have pending local changes (using ref for current state)
          const hasPendingChanges = itemsRef.current.some(i => i.syncStatus === PENDING && i.list_id === pin);
          if (!hasPendingChanges) {
            setTimeout(async () => {
              await syncNow();
              isHandlingRealtimeUpdate.current = false;
            }, 200);
          } else {
            console.log('🔄 Skipping realtime sync - have pending local changes');
            isHandlingRealtimeUpdate.current = false;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
  }, [pin]);

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
    () => (pin ? items.filter(i => !i.deleted && i.list_id === pin) : []),
    [items, pin]
  );
  const completedCount = useMemo(() => visibleItems.filter(i => i.done).length, [visibleItems]);

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
      toast({ title: "Enter PIN", description: "Please set a PIN to add items." });
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
    toast({ title: "Cleared completed", description: "Completed items marked for deletion (pending sync)." });
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  };

  const syncNow = async (snapshot?: ShoppingItem[]) => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Connect to the internet to sync." });
      return;
    }
    if (!pin) {
      toast({ title: "Enter PIN", description: "Set a PIN to sync your list." });
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
        const toPush = pending.map(({ syncStatus, ...rest }) => rest);
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
      
      toast({ title: "Synced", description: `${pending.length} changes pushed, ${mergedForPin.length} items synced.` });
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
      toast({ title: "Offline", description: "Connect to the internet to sync." });
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
            <h1 className="text-2xl md:text-3xl font-bold">Offline Shopping List</h1>
            <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Online" : "Offline"}</Badge>
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
          <h1 className="text-2xl md:text-3xl font-bold">Offline Shopping List</h1>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>{isOnline ? "Online" : "Offline"}</Badge>
            <span className="text-sm text-muted-foreground">PIN: {pin}</span>
            <Button variant="ghost" size="sm" onClick={clearPin} aria-label="Change PIN">Change</Button>
            <Button variant="secondary" size="sm" onClick={requestSync} disabled={!isOnline || isSyncing} aria-label="Sync with cloud" aria-busy={isSyncing}>
              <Cloud className="mr-2 h-4 w-4" /> Sync
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 sm:py-10">
        <section aria-labelledby="list-heading" className="mx-auto max-w-2xl">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle id="list-heading">Your List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-stretch">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add an item..."
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

              <ul className="space-y-3">
                {visibleItems.length === 0 && (
                  <li className="text-muted-foreground text-sm">Your list is empty. Add your first item!</li>
                )}
                {visibleItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={item.done} onCheckedChange={() => toggleDone(item.id)} aria-label={`Toggle ${item.text}`} />
                      <div>
                        <p className="font-medium leading-none">{item.text}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">-</Button>
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, +1)} aria-label="Increase quantity">+</Button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Completed: {completedCount}</p>
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
