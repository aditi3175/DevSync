import express from "express";
import * as ctrl from "../controllers/monitor.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateBody from "../middlewares/validate.middleware.js";
import { z } from "zod";

const router = express.Router();

// validation schemas
const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]).optional(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional().nullable(),
  frequencyMinutes: z.number().min(1).optional(),
  timeoutMs: z.number().min(1000).optional(),
  assertions: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

router.use(authMiddleware); // all routes protected

router.post("/", validateBody(createSchema), ctrl.createMonitor);
router.get("/", ctrl.listMonitors);
router.get("/:id", ctrl.getMonitor);
router.put("/:id", validateBody(updateSchema), ctrl.updateMonitor);
router.delete("/:id", ctrl.deleteMonitor);

// manual run
router.post("/:id/run", ctrl.runMonitorNow);

//Get check history for monitor (Last 24 hours)
router.get("/:id/history", ctrl.getMonitorHistory);

export default router;
