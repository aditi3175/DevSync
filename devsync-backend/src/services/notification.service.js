import { notificationQueue } from "../queues/notificationQueue.js";

/**
 * Enqueue a notification job with retries/backoff.
 * Returns the Bull job instance.
 */
export async function enqueueNotification(type, payload) {
  try {
    const job = await notificationQueue.add(type, payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
    });
    console.log(
      `[notify] Enqueued ${type} job id=${job.id} payload=${JSON.stringify(payload)}`
    );
    return job;
  } catch (err) {
    console.error("[notify] Failed to enqueue notification:", err);
    throw err;
  }
}

/**
 * High-level helpers used by the monitor worker.
 */
export async function notifyMonitorDown(monitor, result) {
  return enqueueNotification("monitor-down", {
    monitorId: String(monitor._id),
    url: monitor.url,
    checkedAt: result.checkedAt,
    statusCode: result.statusCode,
  });
}

export async function notifyMonitorUp(monitor, result) {
  return enqueueNotification("monitor-up", {
    monitorId: String(monitor._id),
    url: monitor.url,
    checkedAt: result.checkedAt,
    statusCode: result.statusCode,
  });
}
