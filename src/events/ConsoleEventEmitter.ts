// Example event emitter: logs events to the console
import type { IEventEmitter } from "./IEventEmitter";
import type { AppEvent } from "./eventTypes";

export class ConsoleEventEmitter implements IEventEmitter {
  emit(event: AppEvent): void {
    // In real use, add filtering, formatting, etc.
    console.log("[Event]", event.type, event);
  }
}
