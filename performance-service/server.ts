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
