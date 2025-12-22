import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";
import { connectDB, closeDB } from "../config/db.js";
import Monitor from "../models/Monitor.js";
import User from "../models/user.js";

import {
  sendMail,
  downTemplate,
  upTemplate,
} from "../services/email.service.js";

const QUEUE_NAME = "notification-queue";
const connectionOption = config.redis?.url
  ? { connection: { url: config.redis.url } }
  : {};

function allowedByCooldown(lastAlertAt, cooldownMinutes) {
  if (!cooldownMinutes || cooldownMinutes <= 0) return true;
  if (!lastAlertAt) return true;
  return (
    Date.now() - new Date(lastAlertAt).getTime() >= cooldownMinutes * 60 * 1000
  );
}

async function handle(job) {
  const { name } = job;
  const data = job.data || {};

  console.log(`[notify-worker] Job ${job.id} → ${name}`);

  const monitor = await Monitor.findById(data.monitorId).lean();
  if (!monitor) {
    console.warn("[notify-worker] Monitor missing for notification");
    return { ok: false };
  }

  const user = monitor.ownerId
    ? await User.findById(monitor.ownerId).lean()
    : null;

  // User alert preference checks
  if (user?.alertsEnabled === false) return { ok: true, skipped: true };
  if (name === "monitor-down" && !user?.alertOnDown)
    return { ok: true, skipped: true };
  if (name === "monitor-up" && !user?.alertOnUp)
    return { ok: true, skipped: true };

  const to = user?.email || config.email?.testRecipient;
  if (!to) return { ok: false, reason: "no-recipient" };

  // Single cooldown check HERE ONLY
  const cooldownMinutes = Number(user?.cooldownMinutes ?? 10);
  const lastAlertAt = monitor.lastAlertAt
    ? new Date(monitor.lastAlertAt)
    : null;

  if (!allowedByCooldown(lastAlertAt, cooldownMinutes)) {
    console.log(`[notify-worker] Skipping due to cooldown`);
    return { ok: true, skipped: true };
  }

  // Send email
  if (name === "monitor-down") {
    const tpl = downTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
  } else if (name === "monitor-up") {
    const tpl = upTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
  }

  // Update lastAlertAt atomically
  await Monitor.updateOne(
    { _id: monitor._id },
    { $set: { lastAlertAt: new Date() } }
  );

  return { ok: true, emailSent: true };
}

async function init() {
  console.log("📨 Notification Worker connecting to MongoDB...");
  await connectDB();
  console.log("📨 Notification Worker connected!");

  const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
    ...connectionOption,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`[notify-worker] Completed ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[notify-worker] FAILED ${job.id}:`, err);
  });

  console.log("📨 Notification Worker started — waiting…");
}

init();
