//  !! Description !!
// Exactly what our original script is doing line-by-line:
//
// groupId: "Error-service": This joins a specialized Consumer Group team.
// If we spin up multiple instances of this worker (consumer),
// Kafka divides the work evenly among them.
//
// fromBeginning: false: Tells the consumer to ignore historical data.
// It will only process messages that arrive after the worker powers up.
//
// event.eventType !== "PAGE_VIEWED": This is an early guard clause filter.
// It drops irrelevant events instantly "so they don't consume database processing time".
//
// bucket.setSeconds(0, 0): This rounds the timestamp down to the nearest minute (e.g., 10:14:35 becomes 10:14:00).
// This is a classic analytics pattern called "Time-Bucket Aggregation",
// allowing we to count views per minute.
//
// ON CONFLICT ... DO UPDATE: An Upsert query.
// If a row for that specific minute and page doesn't exist, it creates it.
// If it already exists, it increments the view count by 1.

import { pool } from "../../shared/db.js";
import { kafka } from "../../shared/kafka.js";
import { handleErrorMessage } from "./handlers/errorHandler.js";

const consumer = kafka.consumer({ groupId: "Error-service" });

const startWorker = async () => {
  console.log("Connecting Kafka consumer stream processing pipeline...");

  // CONNECT< SUBSCRIBE< RUN
  await consumer.connect();
  await consumer.subscribe({
    topic: "analytics.raw",
    fromBeginning: false,
  });
  console.log("Error worker listening continuously for incoming streams...");
  await consumer.run({
    eachMessage: handleErrorMessage,
  });
};

// 2. Create a function to handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Initiating worker shutdown routine...`);

  try {
    // 1. Tell Kafka we are disconnecting so it re-balances the consumer group instantly
    await consumer.disconnect();
    console.log("Kafka consumer disconnected cleanly.");

    // 2. Shut down the database pool to close lingering network sockets
    await pool.end();
    console.log("Database connection pool terminated safely.");

    process.exit(0);
  } catch (err) {
    console.error("Error occurred during unexpected loop termination:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  return gracefulShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  return gracefulShutdown("SIGTERM");
});

startWorker().catch((error) => {
  console.error("Critical worker boot fault execution crashed:", error);
  process.exit(1);
});
