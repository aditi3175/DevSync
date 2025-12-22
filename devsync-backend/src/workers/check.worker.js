import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Worker } = require("bullmq");

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import CheckHistory from "../models/CheckHistory.js";
import { performCheck } from "../services/check.service.js";
import { enqueueNotification } from "../services/notification.service.js";
import { connectDB } from "../config/db.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis?.url
  ? { connection: { url: config.redis.url } }
  : {};

async function init() {
  console.log("🔌 Check Worker connecting to MongoDB...");
  await connectDB();
  console.log("✅ Check Worker connected");

  new Worker(QUEUE_NAME, async (job) => handle(job), {
    ...connectionOption,
    concurrency: 5,
  });

  console.log("🟢 Check Worker started");
}

async function handle(job) {
  const { monitorId, trigger } = job.data;

  const monitor = await Monitor.findById(monitorId);
  if (!monitor) return;

  if (!monitor.enabled && trigger !== "manual") return;

  // -------------------------------------
  // PERFORM CHECK
  // -------------------------------------
  let result;
  try {
    result = await performCheck(monitor);
  } catch (err) {
    result = {
      ok: false,
      statusCode: null,
      responseTimeMs: null,
      error: err.message,
      checkedAt: new Date(),
    };
  }

  const previousStatus = monitor.lastStatus || "unknown";
  const newStatus = result.ok ? "up" : "down";

  // -------------------------------------
  // SAVE HISTORY (simple, no transaction)
  // -------------------------------------
  const history = await CheckHistory.create({
    monitorId,
    jobId: job.id,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
    ok: result.ok,
    error: result.error,
    checkedAt: result.checkedAt,
  });

  // -------------------------------------
  // ATOMIC MONITOR UPDATE (no conflict possible)
  // -------------------------------------
  const inc = newStatus === "down" ? { $inc: { consecutiveFails: 1 } } : {};
  const set = {
    lastStatus: newStatus,
    lastResponseTime: result.responseTimeMs,
    lastCheckedAt: result.checkedAt,
    ...(newStatus === "up" ? { consecutiveFails: 0 } : {}),
  };

  await Monitor.updateOne({ _id: monitorId }, { $set: set, ...inc });

  // -------------------------------------
  // ALERT LOGIC
  // -------------------------------------
  const fails = newStatus === "down" ? monitor.consecutiveFails + 1 : 0;
  const threshold = monitor.alertThreshold ?? 1;

  if (newStatus === "down" && fails >= threshold) {
    await enqueueNotification("monitor-down", {
      monitorId,
      historyId: history._id,
      result,
    });
  }

  if (newStatus === "up" && previousStatus === "down") {
    await enqueueNotification("monitor-up", {
      monitorId,
      historyId: history._id,
      result,
    });
  }

  return { ok: result.ok, historyId: history._id };
}

init();
