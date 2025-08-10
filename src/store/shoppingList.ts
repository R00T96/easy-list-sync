export type SyncStatus = "pending" | "synced";

export type ShoppingItem = {
  id: string;
  list_id: string;
  text: string;
  qty: number;
  done: boolean;
  updated_at: string; // ISO string
  deleted: boolean;
  syncStatus: SyncStatus;
};

const STORAGE_KEY = "shopping-items-v1";

export function loadItems(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShoppingItem[];
    // basic shape validation fallback
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveItems(items: ShoppingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
