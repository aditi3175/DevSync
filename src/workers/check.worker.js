// src/workers/check.worker.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import CheckHistory from "../models/CheckHistory.js";
import { performCheck } from "../services/check.service.js";
import { connectDB, closeDB } from "../config/db.js";
import {
  notifyMonitorDown,
  notifyMonitorUp,
} from "../services/notification.service.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

/**
 * Initialize: connect to MongoDB first, then start worker.
 */
async function init() {
  try {
    console.log("🔌 Worker: connecting to MongoDB...");
    await connectDB();
    console.log("✅ Worker: MongoDB connected");

    // Now create the worker
    const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
      ...connectionOption,
      concurrency: 5,
    });

    worker.on("completed", (job, returnvalue) => {
      console.log(`[worker] Job ${job.id} completed:`, returnvalue);
    });

    worker.on("failed", (job, err) => {
      console.error(`[worker] Job ${job.id} FAILED:`, err);
    });

    console.log("🔁 Monitor Worker started — Waiting for jobs...");

    // graceful shutdown
    const shutdown = async () => {
      console.log("🛑 Worker shutdown initiated...");
      try {
        await worker.close(); // stops receiving new jobs and closes
      } catch (e) {
        console.warn("Worker close error:", e?.message ?? e);
      }
      try {
        await closeDB();
      } catch (e) {
        console.warn("DB close error:", e?.message ?? e);
      }
      console.log("🔌 Worker shutdown complete. Exiting.");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", async (err) => {
      console.error("Uncaught exception in worker:", err);
      await shutdown();
    });
    process.on("unhandledRejection", async (reason) => {
      console.error("Unhandled rejection in worker:", reason);
      await shutdown();
    });
  } catch (err) {
    console.error("❌ Worker init failed:", err);
    process.exit(1);
  }
}

/**
 * Job handler
 */
async function handle(job) {
  const { monitorId, trigger = "manual" } = job.data;

  console.log(
    `[worker] Processing job ${job.id} for monitor=${monitorId} trigger=${trigger}`
  );

  // read monitor from DB
  let monitor;
  try {
    monitor = await Monitor.findById(monitorId);
  } catch (err) {
    console.error(`[worker] DB error fetching monitor ${monitorId}:`, err);
    throw err;
  }

  if (!monitor) {
    console.warn(`[worker] Monitor ${monitorId} not found`);
    return { ok: false, reason: "monitor-not-found" };
  }

  if (!monitor.enabled && trigger !== "manual") {
    console.log(`[worker] Monitor ${monitorId} is disabled, skipping`);
    return { ok: false, reason: "monitor-disabled" };
  }

  const previousStatus = monitor.lastStatus; // store before update
  const result = await performCheck(monitor);

  // Save CheckHistory
  let history;
  try {
    history = await CheckHistory.create({
      monitorId: monitor._id,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      ok: result.ok,
      bodyHash: result.bodyHash,
      responseSnippet: result.responseSnippet,
      error: result.error,
      checkedAt: result.checkedAt,
    });
  } catch (err) {
    console.error(
      `[worker] Failed to write CheckHistory for monitor ${monitorId}:`,
      err
    );
    // continue — we still update monitor and attempt notifications
  }

  // Update Monitor document
  const newStatus = result.ok ? "up" : "down";
  monitor.lastStatus = newStatus;
  monitor.lastResponseTime = result.responseTimeMs;
  monitor.lastCheckedAt = result.checkedAt;

  try {
    await monitor.save();
  } catch (err) {
    console.error(`[worker] Failed to update Monitor ${monitorId}:`, err);
  }

  // Notifications: enqueue only when status changes
  try {
    if (previousStatus !== newStatus) {
      if (newStatus === "down") {
        console.log(
          `[worker] Status change detected: ${previousStatus} -> down for monitor=${monitorId}. Enqueuing DOWN notification.`
        );
        await notifyMonitorDown(monitor, result);
        console.log(
          `[worker] Enqueued DOWN notification for monitor=${monitorId}`
        );
      } else {
        console.log(
          `[worker] Status change detected: ${previousStatus} -> up for monitor=${monitorId}. Enqueuing UP notification.`
        );
        await notifyMonitorUp(monitor, result);
        console.log(
          `[worker] Enqueued UP notification for monitor=${monitorId}`
        );
      }
    } else {
      // optional: debug log
      // console.log(`[worker] No status change for monitor=${monitorId} (${newStatus})`);
    }
  } catch (err) {
    console.error(
      `[worker] Failed to enqueue notification for monitor ${monitorId}:`,
      err
    );
    // do not throw — notification failure shouldn't stop monitoring
  }

  console.log(
    `[worker] Completed job ${job.id} monitor=${monitorId} ok=${result.ok}`
  );

  return { ok: result.ok, historyId: history?._id ?? null };
}

// start
init();
