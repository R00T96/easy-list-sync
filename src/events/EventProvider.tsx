import React, { useMemo } from "react";
import { eventRegistry } from "./EventRegistry";
import { ConsoleEventEmitter } from "./ConsoleEventEmitter";
import { SeqEventEmitter } from "./SeqEventEmitter";

import { MqttEventEmitter } from "./MqttEventEmitter";
import { EventContext } from "./EventContext";
import type { AppEvent } from "./eventTypes";

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Register emitters only once per provider instance (safe for HMR)
  React.useEffect(() => {    
    

  // Register default emitters (console, SEQ, MQTT)
  // eventRegistry.register(new ConsoleEventEmitter());
  // eventRegistry.register(new SeqEventEmitter("http://localhost:5341"));
  // eventRegistry.register(new MqttEventEmitter("ws://broker.emqx.io:8083/mqtt", "easy-list-sync/events"));

    return () => {
      // Optionally unregister on unmount (not strictly needed for singleton)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    emit: (event: AppEvent) => eventRegistry.emit(event),
    registry: eventRegistry,
  }), []);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};