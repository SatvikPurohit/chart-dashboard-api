import { EachMessagePayload } from "kafkajs";
import { ErrorEvent } from "../types/errorEvent.js";
import { upsertErrorMetric } from "../services/dbService.js";

export async function handleErrorMessage({
  message,
}: EachMessagePayload): Promise<void> {
  if (!message.value) return; // Guard clause against empty messages

  try {
    // Parse the raw Kafka binary buffer into our typed object structure
    const event: ErrorEvent = JSON.parse(message.value.toString());

    // Filter out unwanted event types early (Middleware/Guard function behavior)
    if (event.eventType !== "ERROR_OCCURRED") {
      return;
    }

    // Time-bucket calculation logic (Aggregating data by minute windows)
    const bucket = new Date(event.timestamp);
    bucket.setSeconds(0, 0);

    // Save calculation out to the database service boundary
    await upsertErrorMetric(bucket, event.data.errorType);
  } catch (error) {
    // Basic error reporting wrapper loop isolation
    console.error("Failed to process Error message event stream raw:", error);
  }
}
