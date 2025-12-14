import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Queue } = bullmq;
import config from "../src/config/index.js";

const QUEUE_NAME = "notification-queue";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};
const q = new Queue(QUEUE_NAME, { ...connectionOption });

async function run() {
  const job = await q.add("monitor-down", {
    monitorId: "TEST",
    url: "http://example.invalid",
    checkedAt: new Date().toISOString(),
  });
  console.log("Added test notification job id=", job.id);
  await q.close();
  process.exit(0);
}

run();
