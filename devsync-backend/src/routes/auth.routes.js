import express from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateBody from "../middlewares/validate.middleware.js";
import { z } from "zod";

const router = express.Router();

// validation schemas (zod)
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validateBody(registerSchema), authCtrl.register);
router.post("/login", validateBody(loginSchema), authCtrl.login);
router.post("/refresh", authCtrl.refresh); // cookie-based
router.post("/logout", authCtrl.logout);
router.get("/me", authMiddleware, authCtrl.me);

export default router;
