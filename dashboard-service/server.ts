import { pool } from "../shared/db.js";
import { redis } from "../shared/redis.js";
import appConfig from "./app.js";

const PORT = Number(process.env.port) || 3000;

const server = async () => {
  const { app } = await appConfig();

  // 1. Capture the server instance returned by listen
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // 2. Create a function to handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n[${signal}] Stopping dashboard processes...`);
    server.close(async () => {
      try {
        await redis.quit();
        await pool.end();
        console.log("Database connection threads closed cleanly.");
        process.exit(0);
      } catch (err) {
        console.error("Error during connection teardown:", err);
        process.exit(1);
      }
    });
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
