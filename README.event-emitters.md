# Event Emitter System

This project now supports a modular, extensible event emitter system for analytics, observability, and integrations. The following emitters are available and registered by default:

## Emitters

### 1. ConsoleEventEmitter
- Logs all events to the browser/Node.js console for debugging and development.

### 2. SeqEventEmitter
- Sends structured events to a [SEQ](https://datalust.co/seq) server for advanced log analytics and alerting.
- Default SEQ endpoint: `http://localhost:5341`
- Example registration:
  ```ts
  eventRegistry.register(new SeqEventEmitter("http://localhost:5341"));
  ```

### 3. MqttEventEmitter
- Publishes all events as JSON messages to an MQTT broker/topic for real-time integrations and IoT scenarios.
- Default broker: `ws://broker.emqx.io:8083/mqtt`
- Default topic: `easy-list-sync/events`
- Example registration:
  ```ts
  eventRegistry.register(new MqttEventEmitter("ws://broker.emqx.io:8083/mqtt", "easy-list-sync/events"));
  ```
- You can test MQTT messages live using: [MQTT.cool Test Client](https://testclient-cloud.mqtt.cool/)
  - Broker: `broker.emqx.io`
  - Port: `8083` (WebSocket)
  - Topic: `easy-list-sync/events`

## How It Works
- All events are emitted via the `eventRegistry` singleton.
- The `EventProvider` (React context) registers all emitters on app startup.
- You can add or remove emitters as needed for your environment.

## Example Usage
```ts
import { eventRegistry } from "./events/EventRegistry";
import { ShoppingListEvent } from "./events/eventTypes";

const event: ShoppingListEvent = {
  type: "ShoppingList",
  item: null,
  meta: { action: "final-merge", clientId: "...", pin: "..." }
};

eventRegistry.emit(event);
```

## Customization
- To add your own emitter, implement the `IEventEmitter` interface and register it with `eventRegistry.register()`.
- You can change the MQTT broker, topic, or SEQ endpoint as needed.

---

For questions or to extend the event system, see the code in `src/events/`.

---

# Updates
## [2025-09-22] Event Topic Routing Upgrade

**Story:**
Previously, all events were published to a single MQTT topic, making it difficult to distinguish between system and user events. This limited observability, security, and future scalability.

**Pros:**
- Enables granular routing of events to system/* and user/{clientId}/* topics
- Backward compatible—existing consumers keep working
- Improves monitoring, filtering, and access control
- Lays groundwork for multi-tenant and enterprise scenarios

**Pain:**
Single-topic publishing created confusion, increased noise, and made it hard to secure or analyze event streams by type or user.

**Mechanism:**
Added an optional `topic` property to events. The MQTT emitter now uses `event.topic` if present, otherwise falls back to the default topic. No breaking changes—existing code continues to work.

**Gain:**
You can now emit system events to `system/heartbeat`, `system/maintenance`, etc., and user events to `user/{clientId}/action`, `user/{clientId}/notification`, etc. This brings clarity, security, and flexibility to your event architecture.

**Consequences:**
1st degree: Events are routed to specific topics, making filtering and monitoring easier.
2nd degree: Consumers can subscribe only to relevant topics, reducing noise and risk.
3rd degree: The system is future-proofed for advanced use cases, integrations, and compliance.
