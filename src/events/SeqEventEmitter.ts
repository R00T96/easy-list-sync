// SEQ event emitter: sends events to a SEQ server via HTTP
import type { IEventEmitter } from "./IEventEmitter";
import type { AppEvent } from "./eventTypes";

export class SeqEventEmitter implements IEventEmitter {
  private seqUrl: string;

  constructor(seqUrl: string) {
    this.seqUrl = seqUrl;
  }

  emit(event: AppEvent): void {
    // Build a descriptive message for SEQ
    // Compose SEQ wire format event
    let level = "Information";
    let messageTemplate: string = event.type;
    let exception: string | undefined = undefined;
    let properties: any = { ...event };

    if (event.type === "ShoppingList" && event.meta) {
      const { action, clientId, pin, mergedCount, userAgent, ...restMeta } = event.meta;
      messageTemplate = `[pin:{pin}] [clientId:{clientId}] action:{action}`;
      properties = {
        ...event,
        action,
        clientId,
        pin,
        mergedCount,
        userAgent,
        ...restMeta
      };
      if (action && ["error", "fail", "failed", "cancel"].some(a => action.toLowerCase().includes(a))) {
        level = "Warning";
      }
    }

    const seqEvent = {
      Timestamp: new Date(),
      Level: level,
      MessageTemplate: messageTemplate,
      Exception: exception,
      Properties: properties
    };


    console.log("SEQ Event:", seqEvent);
    fetch(`${this.seqUrl}/api/events/raw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Events: [seqEvent]
      })
    }).catch((err) => {
      // Optionally log or handle errors
      // console.error("SEQ emit error", err);
    });
  }
}
