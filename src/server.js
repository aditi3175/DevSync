import http from "http";
import config from "./config/index.js";
import { connectDB, closeDB } from "./config/db.js";
import { connectRedis, closeRedis } from "./config/redis.js";
import app from "./app.js";

let server;
let shuttingDown = false;

async function start() {
  try {
    // 1) Connect to DB
    await connectDB();

    // 2) Connect to Redis (optional)
    // connectRedis returns the client or null
    try {
      connectRedis();
    } catch (err) {
      console.warn(
        "Warning: Redis failed to connect (will continue without Redis).",
        err.message
      );
    }

    // 3) Create http server and listen
    server = http.createServer(app);

    server.listen(config.server.port, () => {
      console.log(
        `Server listening on port ${config.server.port} (env=${config.server.env})`
      );
    });

    // Handle server 'error' events (e.g. EADDRINUSE)
    server.on("error", (err) => {
      console.error("HTTP server error:", err);
      // For fatal server errors, attempt graceful shutdown
      if (!shuttingDown) shutdown("SERVER_ERROR", 1);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    // If DB connection failed, exit with non-zero code
    process.exit(1);
  }
}

/**
 * Graceful shutdown helper
 * @param {string} reason - human readable reason
 * @param {number} exitCode - process exit code
 */
async function shutdown(reason = "SIGTERM", exitCode = 0) {
  if (shuttingDown) {
    console.log("Shutdown already in progress...");
    return;
  }
  shuttingDown = true;

  console.log(
    `\n🛑 Shutdown initiated (${reason}) — closing server and connections...`
  );

  const forceTimeout = setTimeout(() => {
    console.warn("Forcing shutdown due to timeout.");
    process.exit(exitCode || 1);
  }, 10000).unref(); // 10s timeout

  try {
    if (server) {
      console.log("Closing HTTP server to stop accepting new connections...");
      await new Promise((resolve) =>
        server.close((err) => {
          if (err) console.error("Error closing HTTP server:", err);
          else console.log("HTTP server closed.");
          resolve();
        })
      );
    }

    // Close Redis if available
    try {
      await closeRedis();
    } catch (err) {
      console.warn("Error closing Redis client:", err?.message ?? err);
    }

    // Close MongoDB
    try {
      await closeDB();
    } catch (err) {
      console.warn("Error closing MongoDB connection:", err?.message ?? err);
    }

    clearTimeout(forceTimeout);
    console.log("Shutdown complete. Exiting now.");
    process.exit(exitCode);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

// Handle termination signals
process.on("SIGTERM", () => shutdown("SIGTERM", 0));
process.on("SIGINT", () => shutdown("SIGINT", 0));

// Uncaught exceptions / unhandled promise rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Attempt graceful shutdown then exit with failure
  shutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Attempt graceful shutdown then exit with failure
  shutdown("unhandledRejection", 1);
});

// Start the server
start();
