// hooks/useServerMerges.ts
import { useCallback } from "react";
import type { ShoppingItem } from "@/store/shoppingList";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { usePin } from "@/hooks/usePin";

export function useServerMerges(clientId: string) {
  const { pin } = usePin();
  const { getItems, setItemsHard } = useShoppingList(); // ensure context exposes getItems()

  const upsertFromServer = useCallback((row: any) => {
    if (!pin || !row || row.list_id !== pin) return;
    if (row.client_id === clientId) return; // ignore self-echo

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

    const local = [...getItems()];
    const idx = local.findIndex(i => i.id === serverItem.id);

    if (idx >= 0) {
      const li = local[idx];

      // 🔒 PENDING-WINS: never override local pending with server
      if (li.syncStatus === "pending") return;

      // Otherwise LWW against server timestamp
      const serverTime = +new Date(serverItem.updated_at);
      const localTime  = +new Date(li.updated_at);
      if (serverTime > localTime) {
        local[idx] = serverItem;
        setItemsHard(local);
      }
    } else {
      setItemsHard([serverItem, ...local]);
    }
  }, [pin, getItems, setItemsHard, clientId]);

  const applyServerDelete = useCallback((row: any) => {
    if (!pin || !row || row.list_id !== pin) return;
    const local = [...getItems()];
    const idx = local.findIndex(i => i.id === String(row.id));
    if (idx === -1) return;

    // Don’t override a pending local resurrection with a server delete
    if (local[idx].syncStatus === "pending") return;

    local[idx] = { ...local[idx], deleted: true, syncStatus: "synced", updated_at: new Date().toISOString() };
    setItemsHard(local);
  }, [pin, getItems, setItemsHard]);

  return { upsertFromServer, applyServerDelete };
}
