import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Queue } = bullmq;
import config from "../src/config/index.js";

const QUEUE_NAME = "notification-queue";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

async function run() {
  const q = new Queue(QUEUE_NAME, { ...connectionOption });
  try {
    const waiting = await q.getWaiting(); // jobs waiting to be processed
    const delayed = await q.getDelayed(); // delayed jobs
    const failed = await q.getFailed(); // failed jobs
    const completed = await q.getCompleted();
    console.log(
      "waiting:",
      waiting.length,
      "delayed:",
      delayed.length,
      "failed:",
      failed.length,
      "completed:",
      completed.length
    );
    if (waiting.length > 0)
      console.log(
        "Waiting job samples:",
        waiting.map((j) => ({ id: j.id, name: j.name, data: j.data }))
      );
    await q.close();
  } catch (e) {
    console.error("ERR listing notification queue:", e);
  } finally {
    process.exit(0);
  }
}
run();
