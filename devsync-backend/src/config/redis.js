import Redis from "ioredis";
import config from "./index.js";

let redisClient = null;
let redisReady = false;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

//-- Connect to Redis --
export function connectRedis() {
  const url = config.redis.url;

  if (!url) {
    console.warn("⚠️  No REDIS_URL found. Redis features will be disabled.");
    console.warn(
      "📌 Set REDIS_URL environment variable to enable queue processing."
    );
    redisReady = false;
    return null;
  }

  console.log("🔌 Connecting to Redis...");

  redisClient = new Redis(url, {
    retryStrategy(times) {
      reconnectAttempts = times;

      // Stop retrying after MAX_RECONNECT_ATTEMPTS
      if (times > MAX_RECONNECT_ATTEMPTS) {
        console.error(
          `❌ Redis connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`
        );
        console.error(
          "⚠️  Queue processing will not work. Monitors will NOT be scheduled."
        );
        redisReady = false;
        return null; // Stop retrying
      }

      const delay = Math.min(times * 100, 3000);
      console.warn(
        `Redis reconnecting... (attempt ${times}/${MAX_RECONNECT_ATTEMPTS})`
      );
      return delay;
    },
    enableReadyCheck: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
    redisReady = true;
    reconnectAttempts = 0;
  });

  redisClient.on("ready", () => {
    console.log("✅ Redis ready for commands");
    redisReady = true;
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
    redisReady = false;

    // Alert if critical
    if (err.code === "ECONNREFUSED") {
      console.error(
        "❌ CRITICAL: Redis connection refused. Queue features disabled."
      );
    }
  });

  redisClient.on("close", () => {
    console.warn("⚠️  Redis connection closed");
    redisReady = false;
  });

  return redisClient;
}

//-- Check if Redis is ready --
export function isRedisReady() {
  if (!redisClient) return false;
  return redisReady && redisClient.status === "ready";
}

//-- Get connection status --
export function getRedisStatus() {
  if (!redisClient) {
    return {
      connected: false,
      status: "not-configured",
      ready: false,
    };
  }

  return {
    connected: redisClient.status === "ready",
    status: redisClient.status,
    ready: isRedisReady(),
    reconnectAttempts,
  };
}

//-- Close Redis Connection --
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("🔌 Redis connection closed");
      redisReady = false;
      redisClient = null;
    } catch (err) {
      console.error("Error closing Redis:", err?.message ?? err);
      // Force disconnect if quit fails
      redisClient.disconnect();
    }
  }
}

//-- Health check for Redis --
export async function checkRedisHealth() {
  if (!redisClient) {
    return { healthy: false, reason: "not-configured" };
  }

  try {
    const pong = await redisClient.ping();
    return {
      healthy: pong === "PONG",
      reason: pong === "PONG" ? "ok" : "invalid-response",
    };
  } catch (err) {
    return {
      healthy: false,
      reason: err?.message ?? "unknown-error",
    };
  }
}

export { redisClient };
