import { useEffect, useMemo, useState, useCallback, useRef, useContext } from "react";
import { EventContext } from "@/events/EventContext";
import { useClientId } from "@/context/ClientIdContext";
import { toast } from "@/hooks/use-toast";
import { loadItems, saveItems, type ShoppingItem, type SyncStatus } from "@/store/shoppingList";
import { createSupabaseWithHeaders, supabase } from "@/integrations/supabase/client";
import { usePin } from "@/hooks/usePin";
import { useDemoSeeds } from "@/hooks/useDemoSeeds";
import { PinGateStage } from "@/components/PinGateStage";
import { ListStage } from "@/components/ListStage";
import type { RealtimeChannel } from "@supabase/supabase-js";

const LiveList = () => {
  const { pin, savePin } = usePin();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [text, setText] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const PENDING: SyncStatus = "pending";
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [urlPin, setUrlPin] = useState<string | null>(null);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const isHandlingRealtimeUpdate = useRef(false);
  

  // Use clientId from context
  const { clientId } = useClientId();
  // Event context for emitting AI/analytics events
  const eventCtx = useContext(EventContext);
  
  // Refs for stable access to current state in callbacks
  const itemsRef = useRef<ShoppingItem[]>([]);
  const isSyncingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);

  // Process URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const raw = urlParams.get("pin");
    if (!raw) return;
    const candidate = raw.trim().toUpperCase();
    const isValid = /^[A-Z0-9]{6}$/.test(candidate);
    if (!isValid) return;
    // If already in a list and incoming is different, show PinGate for auto-join
    if (!pin || pin !== candidate) {
      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: null,
          meta: {
            action: "pin-switch",
            clientId,
            oldPin: pin,
            newPin: candidate,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }
      setUrlPin(candidate);
    }
    // Emit event for detected PIN from URL
    if (eventCtx) {
      eventCtx.emit({
        type: "ShoppingList",
        item: null,
        meta: {
          action: "pin-detected-from-url",
          clientId,
          pin,
          urlPin: candidate,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }
      });
    }
  }, [pin, eventCtx, clientId]);

  // Handler for PIN setting (from PinGate component)
  const handlePinSet = (newPin: string) => {
    savePin(newPin);
    setUrlPin(null); // Clear URL pin after successful entry
  };

  // SEO
  useEffect(() => {
    const title = pin ? `Our List: ${pin}` : "Our List — From last-minute chaos to calm under 30 seconds";
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Get 10+ brains on the same page in 10 seconds. No login, instant link share, works on any device.");
  }, [pin]);

  // Centralized function to update items, refs, and persistence
  const applyItems = (next: ShoppingItem[]) => {
    itemsRef.current = next;  // Update ref first
    setItems(next);           // Schedule state update
    saveItems(next);          // Persist to storage
  };

  const addItem = () => {
    if (!pin) {
      toast({ title: "Join List", description: "Please join a list to add items." });
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
      client_id: clientId,
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

  // Batch add function for demo seeds (more efficient than adding one by one)
  const batchAddItems = useCallback((itemTexts: string[]) => {
    if (!pin) {
      toast({ title: "Join List", description: "Please join a list to add demo items." });
      return;
    }

    // Create multiple items at once
    const newItems: ShoppingItem[] = itemTexts.map(itemText => ({
      id: crypto.randomUUID(),
      list_id: pin,
      text: itemText,
      qty: 1,
      done: false,
      updated_at: new Date().toISOString(),
      deleted: false,
      syncStatus: PENDING,
      client_id: clientId,
    }));

    // Add all demo items to the beginning of the list
    const updated = [...newItems, ...itemsRef.current];
    applyItems(updated);
    
    // Immediate sync for real-time experience
    if (isOnline && !isSyncingRef.current) {
      syncNow(updated);
    }
  }, [pin, isOnline]);

  // Initialize demo seeds hook
  const { seedDemo, availableCategories } = useDemoSeeds({
    pin,
    setText,
    addItem,
    onBatchAdd: batchAddItems
  });

  // Helper to merge a single server row into local state safely
  const upsertFromServer = useCallback((row: any) => {
    if (!row || row.list_id !== pin) return;
    
    // Ignore self-echo events
  if (row.client_id === clientId) {
      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: row,
          meta: {
            action: "ignore-self-echo",
            clientId,
            pin,
            itemId: row.id,
            text: row.text,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }
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
      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: serverItem,
          meta: {
            action: "server-insert",
            clientId,
            pin,
            itemId: serverItem.id,
            text: serverItem.text,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }
    } else {
      next = [...local];
      next[idx] = { ...serverItem, syncStatus: "synced" };
      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: serverItem,
          meta: {
            action: "server-update",
            clientId,
            pin,
            itemId: serverItem.id,
            text: serverItem.text,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }
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
    if (eventCtx) {
      eventCtx.emit({
        type: "ShoppingList",
        item: row,
        meta: {
          action: "server-delete",
          clientId,
          pin,
          itemId: row.id,
          text: row.text,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }
      });
    }
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
      toast({ title: "Join List", description: "Join a list to sync progress." });
      return;
    }
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;  // Set ref guard first
    setIsSyncing(true);
    
    if (eventCtx) {
      eventCtx.emit({
        type: "ShoppingList",
        item: null,
        meta: {
          action: "sync-start",
          clientId,
          pin,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }
      });
    }
    
    try {
      const sb = createSupabaseWithHeaders({ "x-list-id": pin });
      
      // Use the freshest snapshot (passed in or from ref)
      const local = (snapshot ?? itemsRef.current).filter(i => i.list_id === pin);
      const pending = local.filter(i => i.syncStatus === PENDING);

      console.log(`📱 Local items: ${local.length}, Pending: ${pending.length}`);

      // Push pending changes first
      if (pending.length > 0) {
        if (eventCtx) {
          eventCtx.emit({
            type: "ShoppingList",
            item: null,
            meta: {
              action: "push-pending-items",
              clientId,
              pin,
              pendingCount: pending.length,
              pendingItems: pending.map(p => p.text),
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            }
          });
        }
        const toPush = pending.map(({ syncStatus, ...rest }) => ({ ...rest, client_id: clientId }));
        const { data: upsertData, error: upsertError } = await sb
          .from("shopping_items")
          .upsert(toPush, { onConflict: "id" })
          .select();
          
        if (upsertError) {
          console.error("❌ Upsert error:", upsertError);
          throw upsertError;
        }
        if (eventCtx) {
          eventCtx.emit({
            type: "ShoppingList",
            item: null,
            meta: {
              action: "push-success",
              clientId,
              pin,
              upsertCount: upsertData?.length ?? 0,
              upsertItems: upsertData?.map((d: any) => d.text),
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            }
          });
        }
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

      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: null,
          meta: {
            action: "server-items-fetched",
            clientId,
            pin,
            count: serverItems?.length || 0,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }

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
            if (eventCtx) {
              eventCtx.emit({
                type: "ShoppingList",
                item: serverItem,
                meta: {
                  action: "server-wins-conflict",
                  clientId,
                  pin,
                  itemId: serverItem.id,
                  text: serverItem.text,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                }
              });
            }
            byId.set(serverItem.id, serverItem);
          } else if (localItem.syncStatus === PENDING) {
            // Local change is newer, push it
            if (eventCtx) {
              eventCtx.emit({
                type: "ShoppingList",
                item: localItem,
                meta: {
                  action: "push-newer-local-change",
                  clientId,
                  pin,
                  itemId: localItem.id,
                  text: localItem.text,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                }
              });
            }
            const { syncStatus, ...payload } = localItem as any;
            await sb.from("shopping_items").upsert([payload], { onConflict: "id" });
            byId.set(serverItem.id, { ...localItem, syncStatus: "synced" });
          }
        } else {
          if (eventCtx) {
            eventCtx.emit({
              type: "ShoppingList",
              item: localItem,
              meta: {
                action: "keep-just-pushed-item",
                clientId,
                pin,
                itemId: localItem.id,
                text: localItem.text,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
              }
            });
          }
        }
      }

      const mergedForPin = Array.from(byId.values()).map(i => ({ ...i, syncStatus: "synced" as SyncStatus }));
      const others = (snapshot ?? itemsRef.current).filter(i => i.list_id !== pin);
      const merged = [...mergedForPin, ...others];
      
      if (eventCtx) {
        eventCtx.emit({
          type: "ShoppingList",
          item: null,
          meta: {
            action: "final-merge",
            clientId,
            pin,
            mergedCount: mergedForPin.length,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }
        });
      }
      
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
 
  useEffect(() => {
    if (eventCtx) {
      eventCtx.emit({
        type: "ShoppingList",
        item: null,
        meta: {
          action: "pin-changed",
          clientId,
          pin,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }
      });
    }
  }, [pin]);

  const actions = {
    addItem,
    updateQty,
    toggleDone,
    clearCompleted,
    restoreItem,
    seedDemo, // Hook provides this function
  };

  return (
    <>
        {!pin || urlPin ? (
          // Show PinGate if no PIN or if switching or via URL share
          <PinGateStage onPinSet={handlePinSet} urlPin={urlPin}/>
        ) : (
          // Show main list when PIN is set
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
            availableCategories={availableCategories} // Pass categories from hook
          />
        )}
    </>
  );
};

export default LiveList;