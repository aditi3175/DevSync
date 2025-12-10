import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Worker } = bullmq;

import config from "../config/index.js";

import Monitor from "../models/Monitor.js";
import User from "../models/user.js";

const QUEUE_NAME = "notification-queue";

const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

async function handle(job) {
  const { name } = job;
  const data = job.data;

  console.log(`[notify-worker] Processing ${name} alert`, data);

  if (name === "monitor-down") {
    // later: send email/slack
    console.log("🚨 ALERT: Monitor DOWN", data.url);
  }

  if (name === "monitor-up") {
    console.log("✅ RECOVERY: Monitor UP again", data.url);
  }

  return { ok: true };
}

const worker = new Worker(QUEUE_NAME, async (job) => handle(job), {
  ...connectionOption,
  concurrency: 5,
});

console.log("📨 Notification worker started");
