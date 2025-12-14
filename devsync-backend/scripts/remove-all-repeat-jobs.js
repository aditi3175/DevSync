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
    console.log("Found repeatable jobs:", jobs.length);
    let removed = 0;
    for (const j of jobs) {
      const key = j.key;
      console.log("Removing repeatable job key=", key, "every=", j.every);
      try {
        // removeRepeatableByKey is the reliable API for repeatables
        if (typeof queue.removeRepeatableByKey === "function") {
          await queue.removeRepeatableByKey(String(key));
        } else {
          // fallback
          await queue.removeJobs(String(key));
        }
        removed++;
      } catch (err) {
        console.warn(
          "Failed to remove repeatable key",
          key,
          err?.message ?? err
        );
      }
    }
    console.log(`Done. Removed ${removed} repeatable job(s).`);
    await queue.close();
  } catch (err) {
    console.error("Error removing repeatable jobs:", err);
  } finally {
    process.exit(0);
  }
}

run();
