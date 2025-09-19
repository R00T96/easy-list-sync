// Example: Registering an event emitter and emitting a ShoppingList event
import { eventRegistry } from "./EventRegistry";
import { ConsoleEventEmitter } from "./ConsoleEventEmitter";
import type { ShoppingItem } from "@/store/shoppingList";

// Register the console emitter (do this at app startup)
eventRegistry.register(new ConsoleEventEmitter());

// Example ShoppingList event emission
const exampleItem: ShoppingItem = {
  id: "item-123",
  list_id: "list-abc",
  text: "Milk",
  qty: 2,
  done: false,
  updated_at: new Date().toISOString(),
  deleted: false,
  syncStatus: "pending",
  client_id: "client-xyz"
};

eventRegistry.emit({
  type: "ShoppingList",
  item: exampleItem,
  meta: {
    action: "add",
    userAgent: navigator.userAgent,
    custom: "demo"
  }
});
