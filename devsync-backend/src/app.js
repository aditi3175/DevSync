import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import authRoutes from "./routes/auth.routes.js";
import monitorRoutes from "./routes/monitor.routes.js";

import mongoose from "mongoose";
import { isRedisReady } from "./config/redis.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// security headers
app.use(helmet());

// allow frontend to call backend
app.use(
  cors({
    origin: config.frontend.url || "http://localhost:3000",
    credentials: true,
  })
);

// JSON body parsing
app.use(express.json({ limit: "1mb" }));

// cookie parsing (for refresh tokens later)
app.use(cookieParser());

// For URL encoded forms (optional)
app.use(express.urlencoded({ extended: true }));

// Auth routes
app.use("/auth", authRoutes);

// Monitor routes
app.use("/api/monitors", monitorRoutes);

// User routes
app.use("/api/user", userRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "DevSync API is running",
    environment: config.server.env,
  });
});

// Health check endpoint
app.get("/healthz", async (req, res) => {
  const uptime = process.uptime();
  const dbState = mongoose.connection.readyState; // 1 = connected
  const dbStatus = dbState === 1 ? "connected" : "disconnected";

  // redis status helper (returns true only if client is ready)
  let redisStatus = "not-configured";
  try {
    redisStatus = isRedisReady()
      ? "connected"
      : config.redis.url
        ? "disconnected"
        : "not-configured";
  } catch (err) {
    redisStatus = "error";
  }

  const overall = dbStatus === "connected" ? "ok" : "fail";
  const code = dbStatus === "connected" ? 200 : 500;

  return res.status(code).json({
    status: overall,
    uptime: Number(uptime.toFixed(2)),
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;