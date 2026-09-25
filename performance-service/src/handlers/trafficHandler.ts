import { EachMessagePayload } from "kafkajs";
import { PerformanceEvent } from "../types/performanceEvent.js";
import { upsertPerformanceMetric } from "../services/dbService.js";

export async function handlePerformanceMessage({
  message,
}: EachMessagePayload): Promise<void> {
  if (!message.value) return; // Guard clause against empty messages

  try {
    // Parse the raw Kafka binary buffer into our typed object structure
    const event: PerformanceEvent = JSON.parse(message.value.toString());

    // Filter out unwanted event types early (Middleware/Guard function behavior)
    if (event.eventType !== "PAGE_VIEWED") {
      return;
    }

    // Time-bucket calculation logic (Aggregating data by minute windows)
    const bucket = new Date(event.timestamp);
    bucket.setSeconds(0, 0);

    // Save calculation out to the database service boundary
    await upsertPerformanceMetric(
      bucket,
      event.data.endpoint,
      event.data.durationMs,
    );
  } catch (error) {
    // Basic error reporting wrapper loop isolation
    console.error("Failed to process traffic message event stream raw:", error);
  }
}
