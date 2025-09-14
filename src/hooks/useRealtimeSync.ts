// hooks/useRealtimeSync.ts
import { useEffect, useRef } from "react";
import { subscribeShoppingItems } from "@/services/realtimeService";

type UpsertFn = (row: any) => void;
type DeleteFn = (row: any) => void;

export function useRealtimeSync(
  pin: string | null,
  upsertFromServer: UpsertFn,
  applyServerDelete: DeleteFn,
  onSubscribed?: () => void
) {
  const chRef = useRef<ReturnType<typeof subscribeShoppingItems> | null>(null);

  // keep latest handlers without changing effect deps
  const upsertRef = useRef(upsertFromServer);
  const deleteRef = useRef(applyServerDelete);
  const onSubRef  = useRef(onSubscribed);
  useEffect(() => { upsertRef.current = upsertFromServer; }, [upsertFromServer]);
  useEffect(() => { deleteRef.current = applyServerDelete; }, [applyServerDelete]);
  useEffect(() => { onSubRef.current  = onSubscribed; }, [onSubscribed]);

  // ensure we only fire onSubscribed once per pin
  const lastSubscribedPinRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pin) return;

    // (Re)subscribe only when the PIN changes
    if (chRef.current) { chRef.current.unsubscribe(); chRef.current = null; }

    chRef.current = subscribeShoppingItems(pin, (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        upsertRef.current(payload.new);
      } else if (payload.eventType === "DELETE") {
        deleteRef.current(payload.old);
      }
    });

    if (lastSubscribedPinRef.current !== pin) {
      lastSubscribedPinRef.current = pin;
      onSubRef.current?.(); // one-time catch-up per pin
    }

    return () => {
      if (chRef.current) { chRef.current.unsubscribe(); chRef.current = null; }
    };
  }, [pin]);
}
