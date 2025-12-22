import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import User from "../models/user.js";
import CheckHistory from "../models/CheckHistory.js";
import { performCheck } from "../services/check.service.js";
import { connectDB, closeDB } from "../config/db.js";
import { enqueueNotification } from "../services/notification.service.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

async function init() {
  try {
    console.log("🔌 Worker: connecting to MongoDB...");
    await connectDB();
    console.log("✅ Worker: MongoDB connected");

    const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
      ...connectionOption,
      concurrency: 5,
    });

    worker.on("completed", (job, ret) => {
      console.log(`[check-worker] Completed job ${job.id}`, ret);
    });

    worker.on("failed", (job, err) => {
      console.error(`[check-worker] FAILED job ${job.id}:`, err);
    });

    console.log("🔁 Check Worker started — Waiting for jobs...");
  } catch (err) {
    console.error("❌ Worker init failed:", err);
    process.exit(1);
  }
}

/* =======================
     HANDLE CHECK JOB
======================= */
async function handle(job) {
  const { monitorId, trigger = "manual" } = job.data;

  console.log(
    `[check-worker] Processing check job ${job.id} for monitor=${monitorId}`
  );

  const monitor = await Monitor.findById(monitorId);
  if (!monitor) {
    console.warn(`[check-worker] Monitor ${monitorId} not found`);
    return { ok: false, reason: "monitor-not-found" };
  }

  if (!monitor.enabled && trigger !== "manual") {
    console.log(`[check-worker] Skipping disabled monitor ${monitorId}`);
    return { ok: false, reason: "monitor-disabled" };
  }

  const previousStatus = monitor.lastStatus || "unknown";

  /* =======================
       RUN THE CHECK
  ======================= */
  let result;
  try {
    result = await performCheck(monitor);
  } catch (err) {
    result = {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      error: err?.message,
      checkedAt: new Date(),
    };
  }

  const newStatus = result.ok ? "up" : "down";

  /* =======================
    TRANSACTION START
   history + monitor update
 ======================= */
  const session = await Monitor.startSession();
  session.startTransaction();

  let historyDoc;

  try {
    // Create history (with jobId for tracking)
    historyDoc = await CheckHistory.create(
      [
        {
          monitorId: monitor._id,
          jobId: job.id,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
          ok: result.ok,
          bodyHash: result.bodyHash,
          responseSnippet: result.responseSnippet,
          error: result.error,
          checkedAt: result.checkedAt,
        },
      ],
      { session }
    );

    // Update monitor state atomically
    const incFail = result.ok ? 0 : 1; // if down → +1

    await Monitor.updateOne(
      { _id: monitor._id },
      {
        $set: {
          lastStatus: newStatus,
          lastResponseTime: result.responseTimeMs,
          lastCheckedAt: result.checkedAt,
        },
        ...(incFail
          ? { $inc: { consecutiveFails: 1 } }
          : { $set: { consecutiveFails: 0 } }),
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("[check-worker] Transaction failed:", err);
    throw err;
  }

  session.endSession();

  /* =======================
     DECIDE IF WE ENQUEUE ALERT
     (no cooldown here)
  ======================= */
  const alertThreshold = Number(monitor.alertThreshold || 1);
  const willAlertDown =
    newStatus === "down" && monitor.consecutiveFails + 1 >= alertThreshold;

  const willAlertUp = newStatus === "up" && previousStatus === "down";

  let didEnqueue = false;

  if (willAlertDown) {
    await enqueueNotification("monitor-down", {
      monitorId: String(monitor._id),
      historyId: historyDoc[0]._id,
      checkJobId: job.id,
      previousStatus,
      newStatus,
      result,
    });
    didEnqueue = true;
  }

  if (willAlertUp) {
    await enqueueNotification("monitor-up", {
      monitorId: String(monitor._id),
      historyId: historyDoc[0]._id,
      checkJobId: job.id,
      previousStatus,
      newStatus,
      result,
    });
    didEnqueue = true;
  }

  return {
    ok: result.ok,
    historyId: historyDoc[0]._id,
    enqueuedNotification: didEnqueue,
  };
}

init();
