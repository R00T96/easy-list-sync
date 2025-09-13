// hooks/useServerMerges.ts
import { useCallback } from "react";
import type { ShoppingItem } from "@/store/shoppingList";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { usePin } from "@/hooks/usePin";

export function useServerMerges(clientId: string) {
  const { pin } = usePin();
  const { items, setItemsHard } = useShoppingList();

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

    const local = [...items];
    const idx = local.findIndex(i => i.id === serverItem.id);

    if (idx >= 0) {
      const li = local[idx];
      const localIsPending = li.syncStatus === "pending";
      const serverTime = new Date(serverItem.updated_at).getTime();
      const localTime = new Date(li.updated_at).getTime();
      if (localIsPending && localTime >= serverTime) return; // keep newer local
      local[idx] = serverItem;
      setItemsHard(local);
    } else {
      setItemsHard([serverItem, ...local]);
    }
  }, [pin, items, setItemsHard, clientId]);

  const applyServerDelete = useCallback((row: any) => {
    if (!pin || !row || row.list_id !== pin) return;
    const local = [...items];
    const idx = local.findIndex(i => i.id === String(row.id));
    if (idx === -1) return;
    local[idx] = { ...local[idx], deleted: true, syncStatus: "synced", updated_at: new Date().toISOString() };
    setItemsHard(local);
  }, [pin, items, setItemsHard]);

  return { upsertFromServer, applyServerDelete };
}
