import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Worker } = require("bullmq");

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import CheckHistory from "../models/CheckHistory.js";
import CheckRun from "../models/CheckRun.js";
import { performCheck } from "../services/check.service.js";
import { enqueueNotification } from "../services/notification.service.js";
import { connectDB, closeDB } from "../config/db.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

/* =====================================
   Main Check Worker Init
===================================== */
async function init() {
  console.log("🔌 Check Worker connecting to MongoDB...");
  await connectDB();
  console.log("✅ Check Worker connected");

  const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
    ...connectionOption,
    concurrency: 5,
  });

  worker.on("failed", (job, err) =>
    console.error(`[check-worker] FAILED job ${job.id}:`, err)
  );

  console.log("🟢 Check Worker started");
}

/* =====================================
   HANDLE CHECK JOB
===================================== */
async function handle(job) {
  const { monitorId, trigger } = job.data;

  const monitor = await Monitor.findById(monitorId);
  if (!monitor) return;

  if (!monitor.enabled && trigger !== "manual") return;

  /* -------------------------------------
       GENERATE IDEMPOTENCY KEY
  ------------------------------------- */
  const checkRunId = `${monitorId}-${Date.now()}`;

  const existing = await CheckRun.findOne({ checkRunId });
  if (existing) {
    console.log("⚠ Duplicate check run, skipping");
    return;
  }

  // Insert check run record (unprocessed yet)
  await CheckRun.create({
    checkRunId,
    monitorId,
    processed: false,
  });

  /* -------------------------------------
      PERFORM CHECK
  ------------------------------------- */
  let result;
  try {
    result = await performCheck(monitor);
  } catch (e) {
    result = {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      error: e.message,
      checkedAt: new Date(),
    };
  }

  const newStatus = result.ok ? "up" : "down";
  const previousStatus = monitor.lastStatus || "unknown";

  /* -------------------------------------
      TRANSACTION START
  ------------------------------------- */
  const session = await Monitor.startSession();
  session.startTransaction();

  let historyDoc;

  try {
    // Create history
    historyDoc = await CheckHistory.create(
      [
        {
          monitorId: monitor._id,
          jobId: job.id,
          checkRunId,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
          ok: result.ok,
          error: result.error,
          checkedAt: result.checkedAt,
        },
      ],
      { session }
    );

    // Update monitor atomically
    await Monitor.updateOne(
      { _id: monitorId },
      {
        $set: {
          lastStatus: newStatus,
          lastResponseTime: result.responseTimeMs,
          lastCheckedAt: result.checkedAt,
        },
        ...(newStatus === "down"
          ? { $inc: { consecutiveFails: 1 } }
          : { $set: { consecutiveFails: 0 } }),
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
  session.endSession();

  // Mark checkRun as processed
  await CheckRun.updateOne({ checkRunId }, { $set: { processed: true } });

  /* -------------------------------------
      ALERT DECISION (NO COOLDOWN HERE)
  ------------------------------------- */
  const alertThreshold = Number(monitor.alertThreshold ?? 1);
  const willDownAlert =
    newStatus === "down" && monitor.consecutiveFails + 1 >= alertThreshold;

  const willUpAlert = newStatus === "up" && previousStatus === "down";

  if (willDownAlert) {
    await enqueueNotification("monitor-down", {
      monitorId,
      checkRunId,
      historyId: historyDoc[0]._id,
      previousStatus,
      newStatus,
      result,
    });
  }

  if (willUpAlert) {
    await enqueueNotification("monitor-up", {
      monitorId,
      checkRunId,
      historyId: historyDoc[0]._id,
      previousStatus,
      newStatus,
      result,
    });
  }

  return {
    ok: result.ok,
    historyId: historyDoc[0]._id,
  };
}

init();
