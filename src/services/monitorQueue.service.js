import { monitorQueue } from "../queues/monitorQueue.js";

export async function enqueueMonitorCheck(monitorId, opts = {}) {
  // jobId can be useful to avoid duplicate enqueues; we keep it simple
  const jobName = "run";
  const data = { monitorId, trigger: opts.trigger || "manual" };

  // options: removeOnComplete true for cleanup, attempts for retries etc
  const job = await monitorQueue.add(jobName, data, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: opts.attempts || 1,
    backoff: { type: "exponential", delay: 5000 },
  });

  return job;
}
