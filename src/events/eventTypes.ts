// Event types and payloads for the event system
import type { ShoppingItem } from "@/store/shoppingList";

// Extendable event type union
export type AppEventType = "ShoppingList";

// Metadata shape for ShoppingList events (can be extended)
export interface ShoppingListEventMeta {
  action: string;
  userAgent?: string;
  [key: string]: any;
}

// Event payload contract
export interface ShoppingListEvent {
  type: "ShoppingList";
  item: ShoppingItem | null; // null for bulk/clear events
  meta: ShoppingListEventMeta;
  topic?: string; // Optional: override topic for event emitters
}

// Union for all app events (extend as needed)
export type AppEvent = ShoppingListEvent;
