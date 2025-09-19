// Registry for managing multiple event emitters (modular, DRY)

import type { IEventEmitter } from "./IEventEmitter";
import type { AppEvent } from "./eventTypes";

class EventRegistry {
  private emitters: IEventEmitter[] = [];

  register(emitter: IEventEmitter) {
    this.emitters.push(emitter);
  }

  unregister(emitter: IEventEmitter) {
    this.emitters = this.emitters.filter(e => e !== emitter);
  }

  emit(event: AppEvent) {
    for (const emitter of this.emitters) {
      emitter.emit(event);
    }
  }
}

// Singleton instance for app-wide use
export const eventRegistry = new EventRegistry();
