import { NextFunction, Response } from "express";
import { KafkaRequest } from "../types/kafka.js";

export const validateEventBody = (
  req: KafkaRequest,
  res: Response,
  next: NextFunction,
) => {
  const { eventType, data } = req.body;

  if (!eventType || !data)
    return res.status(400).json({
      error: "eventType and data required",
    });

  // Validation passed cleanly. Safely advance the request to the next step in line (the controller).
  return next();
};
