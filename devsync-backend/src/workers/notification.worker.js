import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Worker } = require("bullmq");

import config from "../config/index.js";
import Monitor from "../models/Monitor.js";
import User from "../models/user.js";
import NotificationLog from "../models/NotificationLog.js";
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
  if (!cooldownMinutes) return true;
  if (!lastAlertAt) return true;
  return (
    Date.now() - new Date(lastAlertAt).getTime() >= cooldownMinutes * 60 * 1000
  );
}

async function init() {
  console.log("📨 Notification Worker connecting to MongoDB...");
  await connectDB();
  console.log("📨 Notification Worker connected!");

  const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
    ...connectionOption,
    concurrency: 2,
  });
}

async function handle(job) {
  const { name } = job;
  const data = job.data;

  const monitor = await Monitor.findById(data.monitorId).lean();
  if (!monitor) return;

  const user = monitor.ownerId
    ? await User.findById(monitor.ownerId).lean()
    : null;

  /* ----------------------------------
      IDEMPOTENCY: notification log
  ---------------------------------- */
  const exists = await NotificationLog.findOne({
    checkRunId: data.checkRunId,
    type: name,
  });

  if (exists) {
    console.log("⚠ Duplicate notification, skipping");
    return;
  }

  // create record before sending
  await NotificationLog.create({
    checkRunId: data.checkRunId,
    monitorId: monitor._id,
    type: name,
    sent: false,
  });

  /* ----------------------------------
        COOLDOWN
  ---------------------------------- */
  const cooldownMinutes = Number(user?.cooldownMinutes ?? 10);
  const lastAlertAt = monitor.lastAlertAt || null;

  if (!allowedByCooldown(lastAlertAt, cooldownMinutes)) {
    console.log("⏳ Skipping notification due to cooldown");
    return;
  }

  const to = user?.email || config.email.testRecipient;

  /* ----------------------------------
        SEND EMAIL
  ---------------------------------- */
  if (name === "monitor-down") {
    const tpl = downTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
  }

  if (name === "monitor-up") {
    const tpl = upTemplate({ monitor, result: data.result });
    await sendMail({ to, ...tpl });
  }

  // mark as sent
  await NotificationLog.updateOne(
    { checkRunId: data.checkRunId },
    { $set: { sent: true } }
  );

  // update cooldown timestamp
  await Monitor.updateOne(
    { _id: monitor._id },
    { $set: { lastAlertAt: new Date() } }
  );

  console.log(`[notify-worker] Notification SENT → ${name}`);
}

init();
