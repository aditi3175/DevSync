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
    console.log("Repeatable jobs found:", jobs.length);
    for (const j of jobs) {
      console.log("---");
      console.log("key:", j.key ?? j.name ?? "(no key)");
      console.log("id:", j.id ?? j.jobId ?? "(no id)");
      console.log("name:", j.name);
      console.log("every(ms):", j.every ?? j.repeat?.every);
      console.log("opts:", j.opts ?? j);
      // try to show monitorId if stored in args/options
      try {
        if (j.id && typeof j.id === "string" && j.id.startsWith("monitor:")) {
          console.log("monitorId (from id):", j.id.replace("monitor:", ""));
        } else if (j.key && typeof j.key === "string") {
          const m = j.key.match(/monitor:([a-f0-9]{10,})/i);
          if (m) console.log("monitorId (from key):", m[1]);
        } else if (
          j.opts &&
          j.opts.jobId &&
          j.opts.jobId.startsWith("monitor:")
        ) {
          console.log(
            "monitorId (from opts.jobId):",
            j.opts.jobId.replace("monitor:", "")
          );
        }
      } catch (e) {}
    }
    await queue.close();
  } catch (err) {
    console.error("Error listing repeatable jobs:", err);
  } finally {
    process.exit(0);
  }
}

run();
