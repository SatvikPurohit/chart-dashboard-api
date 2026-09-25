import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  socket: {
    connectTimeout: 2000,
    reconnectStrategy(retries) {
      if (retries > 10) return new Error("Redis reconnect limit exceeded");
      //  Waits 100ms, then 200ms, then 400ms... up to a maximum of 3000ms
      //
      // retries * 100 means:
      // Try 1: wait 100ms
      // Try 2: wait 2000ms
      // Try 3: wait 300ms
      return Math.min(retries * 100, 3000);
    },
  },
});

// Don't assume Redis is immortal.
//
// network failure
// restart
// failover
// memory pressure
// connection exhaustion
// DNS issue
// maintenance
redis.on("error", (error) => {
  console.error("Redis error:", error);
});
redis.on("reconnecting", () => {
  console.warn("Redis reconnecting...");
});
// route, middleware, controller
// router.get('/profile', checkApiKey, getUserProfile);
