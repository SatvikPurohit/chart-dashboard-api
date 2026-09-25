import { NextFunction, Response } from "express";
import { KafkaRequest } from "../types/kafka.js";

interface EventPayload {
  eventId: string;
  eventType: string;
  eventVersion: number;
  timestamp: string;
  userId: string | null;
  data: any;
}

export const ingestEvent = async (
  req: KafkaRequest,
  resp: Response,
  next: NextFunction,
) => {
  try {
    const { eventType, userId, data } = req.body;

    const event: EventPayload = {
      // event metadata MANDATORY or BEST PRACTICE
      eventId: crypto.randomUUID(),
      eventType,
      eventVersion: 1,
      //   Data
      timestamp: new Date().toISOString(),
      userId: userId ?? null,
      data,
    };

    await req.kafkaProducer?.send({
      topic: "analytics.raw",
      messages: [
        {
          key: userId ?? event.eventId,
          value: JSON.stringify(event),
        },
      ],
    });

    return resp.status(202).json({
      accepted: true,
      eventId: event.eventId,
    });
  } catch (error) {
    // When our controller tries to talk to Kafka using await req.kafkaProducer.send(),
    // things can go wrong.
    // The network could snap, or the Kafka server could be completely unavailable
    //
    // If we put an error inside next(error)—
    // Express instantly sounds an alarm.
    // It skips all remaining regular routes and looks for your global/central error handler at
    // the absolute bottom of the file
    next(error);
  }
};
