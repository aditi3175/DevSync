import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Queue } = bullmq;

import config from "../src/config/index.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

async function run() {
  const queue = new Queue(QUEUE_NAME, { ...connectionOption });
  try {
    const jobs = await queue.getRepeatableJobs();
    console.log("Total repeatable jobs:", jobs.length);
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      console.log("--- JOB", i, "---");
      // print all enumerable keys
      for (const k of Object.keys(j)) {
        try {
          console.log(k + ":", JSON.stringify(j[k]));
        } catch (e) {
          console.log(k + ":", String(j[k]));
        }
      }
    }
    await queue.close();
  } catch (err) {
    console.error("Error listing repeatable jobs:", err);
  } finally {
    process.exit(0);
  }
}

run();
