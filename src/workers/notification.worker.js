import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import { connectDB, closeDB } from "../config/db.js";
// Adjust model import case to match your project (User vs user)
import Monitor from "../models/Monitor.js";
import User from "../models/User.js";

import { sendMail, downTemplate, upTemplate } from "../services/email.service.js";

const QUEUE_NAME = "notification-queue";
const connectionOption = config.redis?.url ? { connection: { url: config.redis.url } } : {};

function shortJSON(obj, max = 800) {
  try {
    const s = JSON.stringify(obj);
    return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
  } catch {
    return String(obj);
  }
}

/**
 * Check cooldown: returns true if allowed to send
 * lastAlertAt: Date or null
 * cooldownMinutes: number (minutes)
 */
function allowedByCooldown(lastAlertAt, cooldownMinutes) {
  if (!cooldownMinutes || cooldownMinutes <= 0) return true;
  if (!lastAlertAt) return true;
  const elapsedMs = Date.now() - new Date(lastAlertAt).getTime();
  return elapsedMs >= cooldownMinutes * 60 * 1000;
}

async function handle(job) {
  const { name } = job;
  const data = job.data || {};

  console.log(`[notify-worker] jobId=${job.id} name=${name} data=${shortJSON(data)}`);

  // default dev/test recipient
  let to = config.email?.testRecipient || process.env.EMAIL_TEST_RECIPIENT || null;

  // load monitor and user (if monitorId present)
  let monitor = null;
  let user = null;
  if (data.monitorId) {
    try {
      monitor = await Monitor.findById(data.monitorId).lean();
    } catch (e) {
      console.warn("[notify-worker] could not load monitor:", e?.message ?? e);
    }
    if (monitor?.ownerId) {
      try {
        user = await User.findById(monitor.ownerId).lean();
      } catch (e) {
        console.warn("[notify-worker] could not load user:", e?.message ?? e);
      }
    }
  }

  // Respect user preferences (Step A)
  if (user) {
    if (!user.alertsEnabled) {
      console.log(`[notify-worker] Skipping; user alerts disabled (user=${user._id})`);
      return { ok: true, skipped: true };
    }
    if (name === "monitor-down" && !user.alertOnDown) {
      console.log(`[notify-worker] Skipping DOWN; user disabled DOWN alerts (user=${user._id})`);
      return { ok: true, skipped: true };
    }
    if (name === "monitor-up" && !user.alertOnUp) {
      console.log(`[notify-worker] Skipping UP; user disabled UP alerts (user=${user._id})`);
      return { ok: true, skipped: true };
    }
    if (user.email) to = user.email;
  }

  if (!to) {
    console.warn("[notify-worker] No recipient configured (EMAIL_TEST_RECIPIENT or user.email). Skipping.");
    return { ok: false, reason: "no-recipient" };
  }

  // Determine cooldownMinutes (user preference if present, else default 10)
  const cooldownMinutes = Number(user?.cooldownMinutes ?? 10);

  // Check cooldown against monitor.lastAlertAt (if monitor exists)
  const lastAlertAt = monitor?.lastAlertAt ? new Date(monitor.lastAlertAt) : null;
  if (!allowedByCooldown(lastAlertAt, cooldownMinutes)) {
    console.log(`[notify-worker] Skipping ${name} for monitor=${monitor?._id ?? data.monitorId} due to cooldown (${cooldownMinutes}m)`);
    return { ok: true, skipped: true, reason: "cooldown" };
  }

  // Prepare template & send mail
  try {
    if (name === "monitor-down") {
      const tpl = downTemplate({ monitor: monitor || { url: data.url }, result: data });
      await sendMail({ to, ...tpl });
      console.log(`[notify-worker] Sent DOWN email to ${to} for monitor=${monitor?._id ?? data.monitorId}`);
    } else if (name === "monitor-up") {
      const tpl = upTemplate({ monitor: monitor || { url: data.url }, result: data });
      await sendMail({ to, ...tpl });
      console.log(`[notify-worker] Sent UP email to ${to} for monitor=${monitor?._id ?? data.monitorId}`);
    } else {
      console.log(`[notify-worker] Unknown job name=${name} — ignoring`);
      return { ok: true, ignored: true };
    }
  } catch (err) {
    console.error("[notify-worker] sendMail failed:", err?.message ?? err);
    throw err; // let bull retry according to job attempts
  }

  // Update monitor.lastAlertAt so cooldown works next time (best-effort)
  if (monitor?._id) {
    try {
      await Monitor.updateOne({ _id: monitor._id }, { $set: { lastAlertAt: new Date() } }).exec();
      console.log(`[notify-worker] Updated monitor.lastAlertAt for ${monitor._id}`);
    } catch (e) {
      console.warn("[notify-worker] Failed to update monitor.lastAlertAt:", e?.message ?? e);
    }
  }

  return { ok: true };
}


async function init() {
  try {
    console.log("🔌 Notification worker: connecting to MongoDB...");
    await connectDB();
    console.log("✅ Notification worker: MongoDB connected");

    // debug config
    try {
      console.log("🔗 Redis URL:", config.redis?.url ?? process.env.REDIS_URL ?? "not-configured");
      console.log("✉️  Test recipient:", config.email?.testRecipient ?? process.env.EMAIL_TEST_RECIPIENT ?? "not-configured");
    } catch {}

    const worker = new Worker(
      QUEUE_NAME,
      async (job) => handle(job),
      {
        ...connectionOption,
        concurrency: 2,
      }
    );

    worker.on("completed", (job) => {
      console.log(`[notify-worker] Job ${job.id} completed`);
    });
    worker.on("failed", (job, err) => {
      console.error(`[notify-worker] Job ${job.id} failed:`, err?.message ?? err);
    });

    console.log("📨 Notification worker started — waiting for jobs...");

    // graceful shutdown
    const shutdown = async () => {
      console.log("🛑 Notification worker shutdown initiated...");
      try { await worker.close(); } catch (e) { console.warn("Worker close error:", e?.message ?? e); }
      try { await closeDB(); } catch (e) { console.warn("DB close error:", e?.message ?? e); }
      console.log("🔌 Notification worker shutdown complete. Exiting.");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", async (err) => {
      console.error("Uncaught exception in notify-worker:", err);
      await shutdown();
    });
    process.on("unhandledRejection", async (reason) => {
      console.error("Unhandled rejection in notify-worker:", reason);
      await shutdown();
    });
  } catch (err) {
    console.error("❌ Notification worker init failed:", err);
    process.exit(1);
  }
}

init();
