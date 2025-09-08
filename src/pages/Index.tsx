import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { loadItems, saveItems, type ShoppingItem, type SyncStatus } from "@/store/shoppingList";
import { createSupabaseWithHeaders, supabase } from "@/integrations/supabase/client";
import { usePin } from "@/hooks/usePin";
import { Header } from "@/components/Header";
import { PinGateStage } from "@/components/PinGateStage";
import { ListStage } from "@/components/ListStage";
import { AppFooter } from "@/components/AppFooter";
import type { RealtimeChannel } from "@supabase/supabase-js";

const Index = () => {
  const { pin } = usePin();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [text, setText] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const PENDING: SyncStatus = "pending";
  const [isSyncing, setIsSyncing] = useState(false);
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
    // Auto-sync when component loads with existing PIN
    if (pin && navigator.onLine) {
      setTimeout(() => {
        syncNow();
      }, 500);
    }
  }, [pin]);

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

  // Remove old PIN management functions since they're now in the hook

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

  useEffect(() => {
    console.log("PIN changed in Index:", pin);
  }, [pin]);

  const actions = {
    addItem,
    updateQty,
    toggleDone,
    clearCompleted,
    restoreItem,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <Header 
          isOnline={isOnline} 
          requestSync={requestSync} 
          isSyncing={isSyncing} 
        />
      </header>

      <main className="container px-4 py-6 sm:py-10">
        {!pin ? (
          <PinGateStage />
        ) : (
          <ListStage
            isOnline={isOnline}
            showAllItems={showAllItems}
            setShowAllItems={setShowAllItems}
            items={visibleItems}
            allItems={allRoomItems}
            text={text}
            setText={setText}
            completedCount={completedCount}
            actions={actions}
          />
        )}
        
        <AppFooter />
      </main>
      
      <div className="border-t bg-muted/30 py-4">
        <div className="container px-4 text-center">
          <a 
            href="https://ko-fi.com/romesh" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
