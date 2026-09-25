//  !! Description !!
// Exactly what our original script is doing line-by-line:
//
// groupId: "traffic-service": This joins a specialized Consumer Group team.
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

import appConfig from "./app.js";

const PORT = Number(process.env.port) || 3000;
const app = appConfig();

// 1. Capture the server instance returned by listen
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// 2. Create a function to handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed. Cleaning up database connections...");
    // Close database connections here (e.g., prisma.\$disconnect() or mongoose.connection.close())
    console.log("Shutdown complete. Exiting process.");
    process.exit(0); // 0 indicates successful, planned termination
  });

  // Force close after 10 seconds if connections are hanging
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => {
  return gracefulShutdown("SIGINT");
});
process.on("SIGTERM", () => {
  return gracefulShutdown("SIGTERM");
});
