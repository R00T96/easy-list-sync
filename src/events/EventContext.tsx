import { createContext } from "react";
import { eventRegistry } from "./EventRegistry";
import type { AppEvent } from "./eventTypes";

// Context type: expose emit function and registry for advanced use
export interface EventContextValue {
  emit: (event: AppEvent) => void;
  registry: typeof eventRegistry;
}

export const EventContext = createContext<EventContextValue | undefined>(undefined);