import Monitor from "../models/Monitor.js";
import CheckHistory from "../models/CheckHistory.js";
import { performCheck } from "../services/check.service.js";
import {
  enqueueMonitorCheck,
  addRepeatableMonitorJob,
  removeRepeatableMonitorJob,
} from "../services/monitorQueue.service.js";


//Controller: create monitor
export async function createMonitor(req, res, next) {
  try {
    const ownerId = req.user.id;
    const payload = req.body;

    const monitor = await Monitor.create({
      ownerId,
      name: payload.name,
      url: payload.url,
      method: payload.method || "GET",
      headers: payload.headers || {},
      body: payload.body || null,
      frequencyMinutes: payload.frequencyMinutes || 5,
      timeoutMs: payload.timeoutMs || 5000,
      assertions: payload.assertions || [],
      enabled: payload.enabled !== false,
    });

    // Add repeatable job if monitor is enabled
    try {
      if (monitor.enabled) {
        await addRepeatableMonitorJob(
          monitor._id.toString(),
          monitor.frequencyMinutes
        );
      }
    } catch (err) {
      console.warn(
        "[monitor.controller] Failed to schedule repeat job on create:",
        err?.message ?? err
      );
    }

    return res.status(201).json({ success: true, monitor });
  } catch (err) {
    next(err);
  }
}


//Controller: list monitors for user
export async function listMonitors(req, res, next) {
  try {
    const ownerId = req.user.id;
    const monitors = await Monitor.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, monitors });
  } catch (err) {
    next(err);
  }
}


//Controller: get monitor by id
export async function getMonitor(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;
    const monitor = await Monitor.findById(id).lean();
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });
    return res.json({ success: true, monitor });
  } catch (err) {
    next(err);
  }
}


//Controller: update monitor

export async function updateMonitor(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;
    const monitor = await Monitor.findById(id);
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    const up = req.body;
    // update allowed fields
    [
      "name",
      "url",
      "method",
      "headers",
      "body",
      "frequencyMinutes",
      "timeoutMs",
      "assertions",
      "enabled",
    ].forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(up, k)) {
        monitor[k] = up[k];
      }
    });

    await monitor.save();

    // Update repeatable job: remove old and (re)create if enabled
    try {
      await removeRepeatableMonitorJob(monitor._id.toString());
      if (monitor.enabled) {
        await addRepeatableMonitorJob(
          monitor._id.toString(),
          monitor.frequencyMinutes
        );
      }
    } catch (err) {
      console.warn(
        "[monitor.controller] Failed to update repeat job on update:",
        err?.message ?? err
      );
    }

    return res.json({ success: true, monitor });
  } catch (err) {
    next(err);
  }
}

//Controller: delete monitor
export async function deleteMonitor(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;
    const monitor = await Monitor.findById(id);
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    // Remove repeatable job first
    try {
      await removeRepeatableMonitorJob(monitor._id.toString());
    } catch (err) {
      console.warn(
        "[monitor.controller] Failed to remove repeat job on delete:",
        err?.message ?? err
      );
    }

    await Monitor.deleteOne({ _id: id });

    // Optionally remove CheckHistory entries for this monitor
    try {
      await CheckHistory.deleteMany({ monitorId: monitor._id });
    } catch (err) {
      console.warn(
        "[monitor.controller] Failed to clean up CheckHistory:",
        err?.message ?? err
      );
    }

    return res.json({ success: true, message: "Monitor deleted successfully" });
  } catch (err) {
    next(err);
  }
}

//Controller: run monitor now (enqueue job)
export async function runMonitorNow(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;
    const monitor = await Monitor.findById(id);
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    const job = await enqueueMonitorCheck(monitor._id.toString(), {
      trigger: "manual",
      attempts: 1,
    });

    return res.json({ success: true, jobId: job.id, message: "Job enqueued" });
  } catch (err) {
    next(err);
  }
}

//Controller: run monitor immediate (synchronous)
export async function runMonitorImmediate(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;
    const monitor = await Monitor.findById(id);
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    const result = await performCheck(monitor);

    const history = await CheckHistory.create({
      monitorId: monitor._id,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      ok: result.ok,
      bodyHash: result.bodyHash,
      responseSnippet: result.responseSnippet,
      error: result.error,
      checkedAt: result.checkedAt,
    });

    monitor.lastStatus = result.ok ? "up" : "down";
    monitor.lastResponseTime = result.responseTimeMs;
    monitor.lastCheckedAt = result.checkedAt;
    await monitor.save();

    return res.json({ success: true, result, history });
  } catch (err) {
    next(err);
  }
}

//Controller: get monitor history
export async function getMonitorHistory(req, res, next) {
  try {
    const ownerId = req.user.id;
    const id = req.params.id;

    // Verify monitor exists and belongs to user
    const monitor = await Monitor.findById(id);
    if (!monitor)
      return res
        .status(404)
        .json({ success: false, message: "Monitor not found" });
    if (String(monitor.ownerId) !== ownerId)
      return res.status(403).json({ success: false, message: "Forbidden" });

    // Get last 24 hours of check history
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await CheckHistory.find({
      monitorId: id,
      checkedAt: { $gte: oneDayAgo },
    })
      .sort({ checkedAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
}
