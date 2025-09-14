// hooks/useSync.ts
// Debounced, silent background syncs + manual foreground sync with toast.
// Guards against concurrent runs and avoids toast spam.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { syncNowService } from "@/services/syncService";
import { usePin } from "@/hooks/usePin";

type SyncOptions = { silent?: boolean };

export function useSync() {
  const { pin } = usePin();
  const { items, setItemsHard } = useShoppingList();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  const isSyncingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const clientIdRef = useRef<string>(
    (typeof window !== "undefined" && localStorage.getItem("client-id")) || crypto.randomUUID()
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("client-id", clientIdRef.current);
    }
  }, []);

  const getLocal = useCallback(() => items, [items]);

  const syncNow = useCallback(
    async (opts?: SyncOptions) => {
      const silent = !!opts?.silent;

      // Basic guards
      if (!pin) {
        if (!silent) toast({ title: "Join a room", description: "Pick a room to sync progress." });
        return;
      }
      if (!isOnline) {
        if (!silent) toast({ title: "You’re offline", description: "I’ll sync as soon as you’re back online." });
        return;
      }
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsSyncing(true);

      // Snapshot local once for a consistent view
      const local = getLocal();
      const pendingCount = local.filter(i => i.list_id === pin && i.syncStatus === "pending").length;

      try {
        // Delegate push + fetch + merge for the current pin to the service
        const mergedForPin = await syncNowService({
          pin,
          clientId: clientIdRef.current,
          getLocal,
        });

        const others = local.filter(i => i.list_id !== pin);
        const merged = [...mergedForPin, ...others];

        setItemsHard(merged);

        // Only toast if this was user-triggered OR we actually pushed something
        if (!silent && pendingCount > 0) {
          toast({
            title: "✨ Everyone’s in sync!",
            description: `${pendingCount} updates shared, ${mergedForPin.length} items live.`,
          });
        }
      } catch (e: any) {
        if (!silent) {
          toast({ title: "Sync failed", description: e?.message || "Please try again." });
        }
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [pin, isOnline, getLocal, setItemsHard]
  );

  // Debounced background sync trigger
  const syncSoon = useCallback(
    (ms = 600, silent = true) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        syncNow({ silent });
      }, ms);
    },
    [syncNow]
  );

  // Online/offline listeners
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Rising-edge autosync: when we FIRST see pendings while online, kick a silent debounced sync
  const lastHadPendingRef = useRef(false);
  useEffect(() => {
    if (!isOnline || !pin) return;
    const hasPending = items.some(i => i.list_id === pin && i.syncStatus === "pending");
    if (hasPending && !lastHadPendingRef.current) {
      syncSoon(400, true);
    }
    lastHadPendingRef.current = hasPending;
  }, [isOnline, pin, items, syncSoon]);

  return {
    isOnline,
    isSyncing,
    syncNow,   // caller can pass { silent: false } for foreground sync with toast
    syncSoon,  // debounced background syncs
    clientId: clientIdRef.current,
  };
}
