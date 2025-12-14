import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/userNotification.controller.js";

const router = express.Router();

router.get("/notifications", authMiddleware, getNotificationSettings);
router.put("/notifications", authMiddleware, updateNotificationSettings);

export default router;
