// MQTT event emitter: publishes events to an MQTT broker
import type { IEventEmitter } from "./IEventEmitter";
import type { AppEvent } from "./eventTypes";
import mqtt, { MqttClient, IClientOptions } from "mqtt";

export class MqttEventEmitter implements IEventEmitter {
  private client: MqttClient;
  private topic: string;
  private isConnected: boolean = false;

  // use: https://testclient-cloud.mqtt.cool/ for testing subscriptions
  constructor(brokerUrl: string, topic: string = "easy-list-sync/events", options?: IClientOptions) {
    this.topic = topic;
    this.client = mqtt.connect(brokerUrl, options);
    this.client.on("connect", () => {
      this.isConnected = true;
    });
    this.client.on("error", (err) => {
      this.isConnected = false;
      this.client.end();
      // Optionally log or handle errors
      console.error("MQTT connection error", err);
    });
    this.client.on("reconnect", () => {
      this.isConnected = false;
    });
  }

  emit(event: AppEvent): void {
    if (!this.isConnected) return;
    try {
      this.client.publish(this.topic, JSON.stringify(event), { qos: 0 });
      console.log("MQTT Event published", event);
    } catch (err) {
      // Optionally log or handle errors
      console.error("MQTT publish error", err);
    }
  }

  disconnect() {
    this.client.end();
  }
}
