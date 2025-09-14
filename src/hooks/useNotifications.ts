/**
 * Subscribes read-only to realtime, computes a diff against your current items, and shows a notification when:
        the event is not from this client,
        permission is granted, and
    the tab is not focused (or you opt to “always notify”).
 */

// hooks/useNotifications.ts
import { useEffect, useRef, useState } from "react";
import { subscribeShoppingItems } from "@/services/realtimeService";
import { useShoppingList } from "@/contexts/ShoppingListContext"; // must expose getItems()
import { usePin } from "@/hooks/usePin";
import { getPermission, requestPermission, show, NotifyPermission } from "@/services/notificationService";

type ChangeEvent = { // minimal shape we use
  id: string; list_id: string; text: string; qty: number; done: boolean;
  deleted: boolean; client_id?: string; updated_at: string;
};

const shortClient = (id?: string) => id ? `Client ${id.slice(-4)}` : "Someone";

export function useNotifications(clientId: string) {
  const { pin } = usePin();
  const { getItems } = useShoppingList();
  const [permission, setPermission] = useState<NotifyPermission>(() => getPermission());
  const alwaysNotifyRef = useRef(false);
  const chRef = useRef<ReturnType<typeof subscribeShoppingItems> | null>(null);

  // Ask on demand (call from UI)
  const enable = async () => setPermission(await requestPermission());
  const setAlwaysNotify = (v: boolean) => { alwaysNotifyRef.current = v; };

  useEffect(() => {
    if (!pin) return;
    // fresh subscribe for current pin
    chRef.current?.unsubscribe();
    chRef.current = subscribeShoppingItems(pin, (payload: any) => {
      const { eventType } = payload;
      const row: ChangeEvent = (eventType === "DELETE" ? payload.old : payload.new) as any;
      if (!row || row.list_id !== pin) return;
      if (row.client_id && row.client_id === clientId) return; // self

      // Diff against current local before merge
      const before = getItems().find(i => i.id === String(row.id));
      const after  = {
        id: String(row.id), list_id: String(row.list_id), text: String(row.text),
        qty: Number(row.qty), done: !!row.done, deleted: !!row.deleted,
        client_id: row.client_id, updated_at: row.updated_at
      };

      const msg = toMessage(eventType, before, after);
      if (!msg) return;

      const tabHidden = document.visibilityState === "hidden" || !document.hasFocus();
      if (permission === "granted" && (tabHidden || alwaysNotifyRef.current)) {
        show({
          title: msg.title,
          body: msg.body,
          tag: `${pin}:${after.id}`, // replace prior notif for the same item
        });
      }
    });
    return () => { chRef.current?.unsubscribe(); chRef.current = null; };
  }, [pin, clientId, permission, getItems]);

  return { permission, enable, setAlwaysNotify };
}

function toMessage(evt: "INSERT" | "UPDATE" | "DELETE", before?: any, after?: any) {
  const actor = shortClient(after?.client_id);
  if (evt === "DELETE" || after?.deleted) {
    return { title: `${actor} removed "${before?.text ?? after?.text}"`, body: "" };
  }
  if (!before) {
    return { title: `${actor} added "${after.text}"`, body: `Qty ${after.qty}` };
  }
  if (before.text !== after.text) {
    return { title: `${actor} updated "${before.text}"`, body: `→ "${after.text}"` };
  }
  if (before.qty !== after.qty) {
    return { title: `${actor} changed qty for "${after.text}"`, body: `${before.qty} → ${after.qty}` };
  }
  if (before.done !== after.done) {
    return { title: `${actor} ${after.done ? "completed" : "reopened"} "${after.text}"`, body: "" };
  }
  return null;
}
