import { Response, NextFunction } from "express";
import { KafkaRequest } from "../types/kafka.js";

export function centralErrorHandler(
  error: any,
  req: KafkaRequest,
  res: Response,
  next: NextFunction,
): void {
  console.error(error);

  res.status(503).json({
    error: "EVENT_INGESTION_FAILED",
  });
}
