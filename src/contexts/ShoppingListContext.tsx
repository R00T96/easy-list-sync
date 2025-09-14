// contexts/ShoppingListContext.tsx
import { createContext, useContext, useMemo, useRef, useState, useCallback, ReactNode } from "react";
import { loadItems, saveItems, type ShoppingItem, type SyncStatus } from "@/store/shoppingList";

type Ctx = {
  items: ShoppingItem[];
  itemsRef: React.MutableRefObject<ShoppingItem[]>;
  setItemsHard: (next: ShoppingItem[]) => void; // used by sync/realtime to commit authoritative merges
  addItemLocal: (item: Omit<ShoppingItem, "id" | "updated_at" | "syncStatus">) => ShoppingItem;
  toggleDoneLocal: (id: string) => void;
  updateQtyLocal: (id: string, delta: number) => void;
  clearCompletedLocal: (pin: string) => number; // returns cleared count
  restoreItemLocal: (id: string) => void;
};
const ShoppingListContext = createContext<Ctx | null>(null);

export const useShoppingList = () => {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used within ShoppingListProvider");
  return ctx;
};

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  console.log('[ShoppingListProvider] Initializing shopping list context');

  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const loadedItems = loadItems();
    console.log('[ShoppingListProvider] Loaded items:', loadedItems);
    return loadedItems;
  });

  const itemsRef = useRef(items);
  const setItemsHard = (next: ShoppingItem[]) => {
    console.log('[ShoppingListProvider] Setting items:', next);
    itemsRef.current = next;
    setItems(next);
    saveItems(next);
  };

  const stamp = () => new Date().toISOString();

  const addItemLocal: Ctx["addItemLocal"] = (base) => {
    const next: ShoppingItem = {
      ...base,
      id: crypto.randomUUID(),
      updated_at: stamp(),
      syncStatus: "pending",
    };
    const merged = [next, ...itemsRef.current];
    console.log('[ShoppingListProvider] Adding item locally:', next);
    setItemsHard(merged);
    return next;
  };

  const toggleDoneLocal = (id: string) => {
    console.log('[ShoppingListProvider] Toggling done for item ID:', id);
    const merged = itemsRef.current.map(i => i.id === id ? { ...i, done: !i.done, updated_at: stamp(), syncStatus: "pending" as SyncStatus } : i);
    setItemsHard(merged);
  };

  const updateQtyLocal = (id: string, delta: number) => {
    console.log('[ShoppingListProvider] Updating quantity for item ID:', id, 'Delta:', delta);
    const merged = itemsRef.current.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta), updated_at: stamp(), syncStatus: "pending" as SyncStatus } : i);
    setItemsHard(merged);
  };

  const clearCompletedLocal = (pin: string) => {
    const cleared = itemsRef.current.filter(i => i.list_id === pin && i.done && !i.deleted).length;
    if (!cleared) return 0;
    const merged = itemsRef.current.map(i =>
      (i.list_id === pin && i.done && !i.deleted)
        ? { ...i, deleted: true, updated_at: stamp(), syncStatus: "pending" as SyncStatus }
        : i
    );
    setItemsHard(merged);
    return cleared;
  };

  const restoreItemLocal = (id: string) => {
    const merged = itemsRef.current.map(i => i.id === id ? { ...i, deleted: false, done: false, updated_at: stamp(), syncStatus: "pending" as SyncStatus } : i);
    setItemsHard(merged);
  };

  const value = useMemo<Ctx>(() => ({
    items,
    itemsRef,
    setItemsHard,
    addItemLocal,
    toggleDoneLocal,
    updateQtyLocal,
    clearCompletedLocal,
    restoreItemLocal,
  }), [items]);

  return <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>;
};