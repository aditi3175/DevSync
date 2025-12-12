import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import User from "../models/User.js";
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
 * Helper: decide if we can send alert w.r.t cooldown and user settings
 * Cooldown value is taken from user.cooldownMinutes (if exists), otherwise fallback to monitor or default 10.
 */
function allowedByCooldown(lastAlertAt, cooldownMinutes) {
  if (!cooldownMinutes || cooldownMinutes <= 0) return true;
  if (!lastAlertAt) return true;
  const elapsedMs = Date.now() - new Date(lastAlertAt).getTime();
  return elapsedMs >= cooldownMinutes * 60 * 1000;
}

// Initialize worker
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
        await worker.close();
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

// Handle a job
async function handle(job) {
  const { monitorId, trigger = "manual" } = job.data;
  console.log(
    `[worker] Processing job ${job.id} for monitor=${monitorId} trigger=${trigger}`
  );

  // load monitor
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

  const previousStatus = monitor.lastStatus || "unknown";
  // Run the actual check (your existing service)
  let result;
  try {
    result = await performCheck(monitor);
  } catch (err) {
    console.error(`[worker] performCheck error for ${monitorId}:`, err);
    // treat as failed check
    result = {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      error: err?.message ?? String(err),
      checkedAt: new Date(),
    };
  }

  // Save CheckHistory (best-effort)
  let history = null;
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
    console.warn(
      `[worker] Failed to write CheckHistory for ${monitorId}:`,
      err?.message ?? err
    );
  }

  // Update lastStatus/responseTime/checkedAt and handle consecutiveFails
  const newStatus = result.ok ? "up" : "down";
  const wasDown = previousStatus === "down";

  if (newStatus === "down") {
    monitor.consecutiveFails = (monitor.consecutiveFails || 0) + 1;
  } else {
    // success => reset consecutive fails
    monitor.consecutiveFails = 0;
  }

  monitor.lastStatus = newStatus;
  monitor.lastResponseTime = result.responseTimeMs;
  monitor.lastCheckedAt = result.checkedAt;

  // Save monitor early so we can base decisions on latest values (but we'll update again if we send alert)
  try {
    await monitor.save();
  } catch (err) {
    console.warn(
      `[worker] Failed to update monitor ${monitorId}:`,
      err?.message ?? err
    );
  }

  // Determine alert threshold and cooldown
  const alertThreshold = Number(monitor.alertThreshold || 1);

  // load user (owner) to get cooldown preference if available
  let user = null;
  try {
    if (monitor.ownerId) {
      user = await User.findById(monitor.ownerId).lean();
    }
  } catch (err) {
    console.warn(
      `[worker] Failed to load user for monitor ${monitorId}:`,
      err?.message ?? err
    );
  }

  const cooldownMinutes = user?.cooldownMinutes ?? 10; // default 10 min if not set

  // Decide whether to send DOWN alert
  let didEnqueueNotification = false;
  const now = new Date();

  if (newStatus === "down") {
    if ((monitor.consecutiveFails || 0) >= alertThreshold) {
      // check cooldown
      if (allowedByCooldown(monitor.lastAlertAt, cooldownMinutes)) {
        // enqueue DOWN notification
        try {
          await notifyMonitorDown(monitor, result);
          // update lastAlertAt on monitor
          monitor.lastAlertAt = now;
          await monitor.save();
          console.log(
            `[worker] Enqueued DOWN notification for monitor=${monitor._id}`
          );
          didEnqueueNotification = true;
        } catch (err) {
          console.error(
            `[worker] Failed to enqueue DOWN notification for ${monitor._id}:`,
            err?.message ?? err
          );
        }
      } else {
        console.log(
          `[worker] Skipping DOWN alert for monitor=${monitor._id} due to cooldown`
        );
      }
    } else {
      console.log(
        `[worker] DOWN detected but consecutiveFails=${monitor.consecutiveFails} < alertThreshold=${alertThreshold} — not alerting yet`
      );
    }
  } else {
    // newStatus === "up"
    // Option: send UP notification when monitor recovered (previously down)
    // We'll send UP if previousStatus was 'down' OR monitor had consecutiveFails > 0
    if (
      wasDown ||
      (monitor.consecutiveFails === 0 && previousStatus === "down")
    ) {
      // ensure cooldown for UP as well (optional)
      if (allowedByCooldown(monitor.lastAlertAt, cooldownMinutes)) {
        try {
          await notifyMonitorUp(monitor, result);
          monitor.lastAlertAt = now;
          await monitor.save();
          console.log(
            `[worker] Enqueued UP notification for monitor=${monitor._id}`
          );
          didEnqueueNotification = true;
        } catch (err) {
          console.error(
            `[worker] Failed to enqueue UP notification for ${monitor._id}:`,
            err?.message ?? err
          );
        }
      } else {
        console.log(
          `[worker] Skipping UP alert for monitor=${monitor._id} due to cooldown`
        );
      }
    } else {
      // no recovery to report
      // console.log(`[worker] No recovery alert for monitor=${monitor._id}`);
    }
  }

  console.log(
    `[worker] Completed job ${job.id} monitor=${monitorId} ok=${result.ok} enqueuedNotification=${didEnqueueNotification}`
  );
  return {
    ok: result.ok,
    historyId: history?._id ?? null,
    enqueuedNotification: didEnqueueNotification,
  };
}

// start
init();
