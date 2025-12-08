import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import CheckHistory from "../models/CheckHistory.js";
import { performCheck } from "../services/check.service.js";

const QUEUE_NAME = "monitor-checks";

/**
 * Build connection option for BullMQ
 */
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {}; // fallback to default localhost Redis

/**
 * Job handler
 */
async function handle(job) {
  const { monitorId, trigger = "manual" } = job.data;

  console.log(
    `[worker] Processing job ${job.id} for monitor=${monitorId} trigger=${trigger}`
  );

  const monitor = await Monitor.findById(monitorId);
  if (!monitor) {
    console.warn(`[worker] Monitor ${monitorId} not found`);
    return { ok: false, reason: "monitor-not-found" };
  }

  // Skip auto checks if disabled (manual triggers still allowed)
  if (!monitor.enabled && trigger !== "manual") {
    console.log(`[worker] Monitor ${monitorId} is disabled, skipping`);
    return { ok: false, reason: "monitor-disabled" };
  }

  // Perform HTTP check
  const result = await performCheck(monitor);

  // Save CheckHistory
  const history = await CheckHistory.create({
    monitorId: monitor._id,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
    ok: result.ok,
    bodyHash: result.bodyHash,
    responseSnippet: result.responseSnippet,
    error: result.error,
    checkedAt: result.checkedAt,
  });

  // Update Monitor document
  monitor.lastStatus = result.ok ? "up" : "down";
  monitor.lastResponseTime = result.responseTimeMs;
  monitor.lastCheckedAt = result.checkedAt;

  await monitor.save();

  console.log(
    `[worker] Completed job ${job.id} monitor=${monitorId} ok=${result.ok}`
  );

  return { ok: result.ok, historyId: history._id };
}

/**
 * Worker initialization
 */
const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
  ...connectionOption,
  concurrency: 5, // how many jobs processed in parallel
});

worker.on("completed", (job, returnvalue) => {
  console.log(`[worker] Job ${job.id} completed:`, returnvalue);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job.id} FAILED:`, err);
});

console.log("🔁 Monitor Worker started — Waiting for jobs…");
