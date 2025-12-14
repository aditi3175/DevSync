import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bullmq = require("bullmq");
const { Queue } = bullmq;

import config from "../config/index.js";

const QUEUE_NAME = "monitor-checks";
const connectionOption = config.redis.url
  ? { connection: { url: config.redis.url } }
  : {};

export const monitorQueue = new Queue(QUEUE_NAME, {
  ...connectionOption,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log("MonitorQueue initialized");
