import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("bullmq");
console.log(Object.keys(pkg));
console.log("QueueScheduler type:", typeof pkg.QueueScheduler);
console.log("Queue type:", typeof pkg.Queue);
