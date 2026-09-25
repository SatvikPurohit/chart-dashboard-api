import { EachMessagePayload } from "kafkajs";
import { PageViewEvent } from "../types/pageViewEvent.js";
import { upsertTrafficMetric } from "../services/dbService.js";

export async function handleTrafficMessage({
  message,
}: EachMessagePayload): Promise<void> {
  if (!message.value) return; // Guard clause against empty messages

  try {
    // Parse the raw Kafka binary buffer into our typed object structure
    const event: PageViewEvent = JSON.parse(message.value.toString());

    // Filter out unwanted event types early (Middleware/Guard function behavior)
    if (event.eventType !== "PAGE_VIEWED") {
      return;
    }

    // Time-bucket calculation logic (Aggregating data by minute windows)
    const bucket = new Date(event.timestamp);
    bucket.setSeconds(0, 0);

    // Save calculation out to the database service boundary
    await upsertTrafficMetric(bucket, event.data.page);
  } catch (error) {
    // Basic error reporting wrapper loop isolation
    console.error("Failed to process traffic message event stream raw:", error);
  }
}
