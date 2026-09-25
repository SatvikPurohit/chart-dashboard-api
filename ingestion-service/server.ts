import { error } from "node:console";
import appConfig from "./app.js";

const PORT = Number(process.env.port) || 3000;

const server = async () => {
  const { app, producer } = await appConfig();

  // 1. Capture the server instance returned by listen
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // 2. Create a function to handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      console.log("HTTP server closed. Cleaning up database connections...");
      try {
        console.log("Disconnecting Kafka producer safely...");
        // 2. Fix: Safely tell Kafka we are leaving so it can flush remaining messages
        //
        // Flushes Data: If our app has any events sitting in its internal memory waiting to go to Kafka,
        // it forces them to send immediately so no customer data is lost.
        // Leases the Lock: It cleanly notifies the Kafka Broker cluster that it is shutting down,
        // preventing the broker from waiting around for a dead connection timeout.
        await producer.disconnect();
        console.log("Kafka producer disconnected cleanly.");
      } catch (kafkaError) {
        console.error("Error disconnecting Kafka producer:", kafkaError);
      }

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
};

server().catch((error) => {
  console.error("Critical server bootstrap failure:", error);
  process.exit(1);
});
