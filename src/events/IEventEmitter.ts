// Interface for event emitters (SOLID, extensible)
import type { AppEvent } from "./eventTypes";

export interface IEventEmitter {
  emit(event: AppEvent): void;
  // Optionally, add async support: emitAsync?(event: AppEvent): Promise<void>;
}
