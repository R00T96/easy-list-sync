// hooks/useSync.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { syncNowService } from "@/services/syncService";
import { usePin } from "@/hooks/usePin";
import type { ShoppingItem, SyncStatus } from "@/store/shoppingList";

type SyncOptions = {
  silent?: boolean;       // no header spinner
  toastOnPush?: boolean;  // show "Synced" if something was pushed (even when silent)
};

export function useSync() {
  const { pin } = usePin();
  const { items, setItemsHard } = useShoppingList();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const isSyncingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  // trailing-edge queue: if a sync is in-flight, we run again immediately after
  const nextRunRequestedRef = useRef(false);
  const nextRunOptsRef = useRef<SyncOptions | undefined>(undefined);

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
      const silent = opts?.silent ?? true;
      const toastOnPush = !!opts?.toastOnPush;

      if (!pin) {
        if (!silent) toast({ title: "Join a room", description: "Pick a room to sync progress." });
        return;
      }
      if (!isOnline) {
        if (!silent) toast({ title: "You’re offline", description: "I’ll sync as soon as you’re back online." });
        return;
      }

      // queue if busy
      if (isSyncingRef.current) {
        nextRunRequestedRef.current = true;
        nextRunOptsRef.current = { silent, toastOnPush };
        return;
      }

      isSyncingRef.current = true;
      if (!silent) setIsSyncing(true);

      // --- WRITE FENCE (snapshot the versions we intend to push) ---
      const startLocal = getLocal();
      const startForPin = startLocal.filter(i => i.list_id === pin);
      const pushedIds = new Set<string>();
      const pushedVersion = new Map<string, string>(); // id -> updated_at we are pushing
      let pendingCount = 0;
      for (const li of startForPin) {
        if (li.syncStatus === "pending") {
          pushedIds.add(li.id);
          pushedVersion.set(li.id, li.updated_at);
          pendingCount++;
        }
      }

      try {
        // Let the service do push+fetch+merge **for that moment in time**
        const mergedForPin = await syncNowService({
          pin,
          clientId: clientIdRef.current,
          getLocal, // service may read local when needed
        });

        // --- FRESH READ AFTER AWAIT ---
        const latest = getLocal();
        const latestOthers = latest.filter(i => i.list_id !== pin);
        const latestForPin = latest.filter(i => i.list_id === pin);

        // Start with the service’s view as "authoritative for the past"
        const byId = new Map<string, ShoppingItem>();
        for (const it of mergedForPin) byId.set(it.id, it);

        // Fold in any local edits that happened **during** the await
        for (const li of latestForPin) {
          const current = byId.get(li.id);
          // If local is pending and newer than service view, keep local
          if (li.syncStatus === "pending") {
            if (!current || +new Date(li.updated_at) > +new Date(current.updated_at)) {
              byId.set(li.id, li);
            }
          } else if (!current) {
            byId.set(li.id, li);
          } else {
            // If local is synced but strictly newer than service (rare), keep the newest
            if (+new Date(li.updated_at) > +new Date(current.updated_at)) byId.set(li.id, li);
          }
        }

        // Only mark as "synced" the ids we actually pushed AND that were NOT edited during the await.
        const finalForPin: ShoppingItem[] = [];
        for (const it of byId.values()) {
          const maybePushedAt = pushedVersion.get(it.id);
          const latestItem = latestForPin.find(x => x.id === it.id);
          const wasEditedDuringAwait =
            latestItem && maybePushedAt && latestItem.updated_at !== maybePushedAt;

          if (maybePushedAt && !wasEditedDuringAwait) {
            finalForPin.push({ ...it, syncStatus: "synced" as SyncStatus });
          } else {
            // keep whatever latest says (pending stays pending)
            finalForPin.push(
              latestItem && +new Date(latestItem.updated_at) >= +new Date(it.updated_at)
                ? latestItem
                : it
            );
          }
        }

        setItemsHard([...finalForPin, ...latestOthers]);

        // Foreground manual sync: toast loudly if anything was pushed at start
        if (!silent && pendingCount > 0) {
          toast({
            title: "✨ Everyone’s in sync!",
            description: `${pendingCount} update${pendingCount > 1 ? "s" : ""} shared, ${finalForPin.length} items live.`,
          });
        }

        // Background with user intent: subtle toast if we actually pushed at start
        if (silent && toastOnPush && pendingCount > 0) {
          toast({
            title: "Synced",
            description: `${pendingCount} update${pendingCount > 1 ? "s" : ""} shared.`,
          });
        }
      } catch (e: any) {
        if (!silent) toast({ title: "Sync failed", description: e?.message || "Please try again." });
      } finally {
        isSyncingRef.current = false;
        if (!silent) setIsSyncing(false);

        // trailing-edge run if requested during this flight
        if (nextRunRequestedRef.current) {
          const rerunOpts = nextRunOptsRef.current;
          nextRunRequestedRef.current = false;
          nextRunOptsRef.current = undefined;
          setTimeout(() => syncNow(rerunOpts), 0);
        }
      }
    },
    [pin, isOnline, getLocal, setItemsHard]
  );

  const syncSoon = useCallback(
    (ms = 500, optsOrSilent: boolean | SyncOptions = true) => {
      const opts: SyncOptions =
        typeof optsOrSilent === "boolean" ? { silent: optsOrSilent } : optsOrSilent;

      if (isSyncingRef.current) {
        // prefer trailing-edge queue
        nextRunRequestedRef.current = true;
        nextRunOptsRef.current = opts;
        return;
      }

      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        syncNow(opts);
      }, ms);
    },
    [syncNow]
  );

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

  // Quiet autosync on first detection of pending
  const lastHadPendingRef = useRef(false);
  useEffect(() => {
    if (!isOnline || !pin) return;
    const hasPending = items.some(i => i.list_id === pin && i.syncStatus === "pending");
    if (hasPending && !lastHadPendingRef.current) {
      syncSoon(350, { silent: true });
    }
    lastHadPendingRef.current = hasPending;
  }, [isOnline, pin, items, syncSoon]);

  return {
    isOnline,
    isSyncing,
    syncNow,   // use for user actions: syncNow({ silent: true, toastOnPush: true })
    syncSoon,  // use for passive triggers
    clientId: clientIdRef.current,
  };
}
