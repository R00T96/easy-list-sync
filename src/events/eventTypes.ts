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
  // Optional rich context for POMDP/belief updates (non-breaking)
  context?: {
    screenOn?: boolean;
    appFg?: boolean;
    ringer?: string;
    motion?: string;
    location?: string;
    timeBucket?: string;
    [key: string]: any;
  };
  notification?: {
    type?: string;
    urgency?: string;
    contentId?: string;
    batchId?: string;
    [key: string]: any;
  };
  outcome?: {
    clicked?: boolean;
    dismissed?: boolean;
    snoozed?: boolean;
    timeToAction?: number;
    [key: string]: any;
  };
}

// Union for all app events (extend as needed)
export type AppEvent = ShoppingListEvent;
