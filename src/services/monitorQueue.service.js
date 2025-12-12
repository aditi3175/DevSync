import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Queue } = bullmq;

import config from "../config/index.js";
import { monitorQueue as importedQueue } from "../queues/monitorQueue.js";

// NOTE: we prefer to reuse the monitorQueue instance exported from queues/monitorQueue.js.
// If importedQueue exists, use it; otherwise create a fallback queue.
const monitorQueue =
  importedQueue ||
  new Queue(
    "monitor-checks",
    config.redis.url ? { connection: { url: config.redis.url } } : {}
  );

/**
 * Enqueue a one-off check job (manual or ad-hoc)
 * @param {string} monitorId
 * @param {object} opts
 * @returns {Promise<Job>}
 */
export async function enqueueMonitorCheck(monitorId, opts = {}) {
  const jobName = "run";
  const data = { monitorId, trigger: opts.trigger || "manual" };

  const job = await monitorQueue.add(jobName, data, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: opts.attempts || 1,
    backoff: { type: "exponential", delay: 5000 },
  });

  return job;
}

/**
 * Helper to build a repeatable jobId for a monitor so we can manage it deterministically
 * @param {string} monitorId
 * @returns {string}
 */
function getRepeatJobId(monitorId) {
  return `monitor:${monitorId}`;
}

/**
 * Add (or replace) a repeatable job for a monitor.
 * If a job with the same jobId exists it will be removed first.
 *
 * @param {string} monitorId
 * @param {number} frequencyMinutes
 */
export async function addRepeatableMonitorJob(monitorId, frequencyMinutes) {
  const repeatEvery = Math.max(1, Number(frequencyMinutes || 1)) * 60 * 1000;
  const jobId = getRepeatJobId(monitorId);

  try {
    // Remove any existing job with same jobId (defensive)
    // removeJobs accepts jobId or pattern
    await monitorQueue.removeJobs(jobId);
  } catch (err) {
    // not fatal — continue
    console.warn(
      "[monitorQueue.service] removeJobs (pre) failed",
      err?.message ?? err
    );
  }

  try {
    const job = await monitorQueue.add(
      "run",
      { monitorId, trigger: "auto" },
      {
        jobId,
        repeat: { every: repeatEvery },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    console.log(
      `[monitorQueue.service] Added repeatable job for monitor=${monitorId} every=${repeatEvery}ms jobId=${jobId}`
    );
    return job;
  } catch (err) {
    console.error("[monitorQueue.service] Failed to add repeatable job", err);
    throw err;
  }
}

/**
 * Remove repeatable job for this monitor
 * @param {string} monitorId
 */
export async function removeRepeatableMonitorJob(monitorId) {
  const jobId = getRepeatJobId(monitorId);
  try {
    await monitorQueue.removeJobs(jobId);
    console.log(`[monitorQueue.service] Removed repeatable job jobId=${jobId}`);
  } catch (err) {
    console.warn(
      `[monitorQueue.service] removeRepeatableMonitorJob error for ${jobId}:`,
      err?.message ?? err
    );
  }
}
