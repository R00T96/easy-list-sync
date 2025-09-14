// hooks/useServerMerges.ts
import { useCallback } from "react";
import type { ShoppingItem } from "@/store/shoppingList";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { usePin } from "@/hooks/usePin";

function showNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico"
    });
  }
}

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

    let shouldShowNotification = false;
    let notificationMessage = "";

    if (idx >= 0) {
      const li = local[idx];
      const localIsPending = li.syncStatus === "pending";
      const serverTime = new Date(serverItem.updated_at).getTime();
      const localTime = new Date(li.updated_at).getTime();
      if (localIsPending && localTime >= serverTime) return; // keep newer local
      
      // Item was updated by another client
      shouldShowNotification = true;
      if (serverItem.done !== li.done) {
        notificationMessage = `"${serverItem.text}" was ${serverItem.done ? 'completed' : 'uncompleted'}`;
      } else if (serverItem.qty !== li.qty) {
        notificationMessage = `"${serverItem.text}" quantity changed to ${serverItem.qty}`;
      } else if (serverItem.text !== li.text) {
        notificationMessage = `Item renamed to "${serverItem.text}"`;
      } else {
        notificationMessage = `"${serverItem.text}" was updated`;
      }
      
      local[idx] = serverItem;
      setItemsHard(local);
    } else {
      // New item added by another client
      shouldShowNotification = true;
      notificationMessage = `"${serverItem.text}" was added to the list`;
      setItemsHard([serverItem, ...local]);
    }

    if (shouldShowNotification) {
      const clientLabel = row.client_id ? row.client_id.slice(-6) : 'unknown';
      showNotification(
        "List Updated",
        `${notificationMessage} by ${clientLabel}`
      );
    }
  }, [pin, items, setItemsHard, clientId]);

  const applyServerDelete = useCallback((row: any) => {
    if (!pin || !row || row.list_id !== pin) return;
    const local = [...items];
    const idx = local.findIndex(i => i.id === String(row.id));
    if (idx === -1) return;
    
    const deletedItem = local[idx];
    local[idx] = { ...local[idx], deleted: true, syncStatus: "synced", updated_at: new Date().toISOString() };
    setItemsHard(local);

    // Show notification for deletion
    if (row.client_id !== clientId) {
      const clientLabel = row.client_id ? row.client_id.slice(-6) : 'unknown';
      showNotification(
        "List Updated",
        `"${deletedItem.text}" was removed by ${clientLabel}`
      );
    }
  }, [pin, items, setItemsHard, clientId]);

  return { upsertFromServer, applyServerDelete };
}