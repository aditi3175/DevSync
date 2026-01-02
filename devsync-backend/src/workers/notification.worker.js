import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Worker } = require("bullmq");

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import User from "../models/user.js";
import { connectDB } from "../config/db.js";
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

async function init() {
  console.log("📨 Notification Worker starting...");
  await connectDB();
  console.log("✅ Notification Worker connected to MongoDB");

  const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
    ...connectionOption,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`[notify-worker] Job completed → ${job.name}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[notify-worker] Job FAILED → ${job?.name}`, err?.message);
  });

  console.log("📨 Notification Worker is LIVE & waiting for jobs...");
}

async function handle(job) {
  console.log(`[notify-worker] Processing job → ${job.name}`, job.data);

  const { name, data } = job;

  if (!data?.monitorId) {
    console.warn("⚠️ Job missing monitorId, skipping");
    return;
  }

  const monitor = await Monitor.findById(data.monitorId).lean();
  if (!monitor) {
    console.warn("⚠️ Monitor not found, skipping");
    return;
  }

  const user = monitor.ownerId
    ? await User.findById(monitor.ownerId).lean()
    : null;

  const cooldownMinutes = Number(user?.cooldownMinutes ?? 10);
  const lastAlertAt = monitor.lastAlertAt || null;

  if (!allowedByCooldown(lastAlertAt, cooldownMinutes)) {
    console.log("⏳ Notification skipped due to cooldown");
    return;
  }

  const to =
    user?.email ||
    config.email?.testRecipient ||
    process.env.EMAIL_TEST_RECIPIENT;

  if (!to) {
    console.error("❌ No email recipient configured");
    return;
  }

  if (name === "monitor-down") {
    const tpl = downTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
    console.log(`📨 DOWN alert sent → ${to}`);
  }

  if (name === "monitor-up") {
    const tpl = upTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
    console.log(`📨 UP alert sent → ${to}`);
  }

  await Monitor.updateOne(
    { _id: monitor._id },
    { $set: { lastAlertAt: new Date() } }
  );
}

init();
