import User from "../models/user.js";
import {
  hashPassword,
  comparePassword,
  generateRefreshToken,
  hashToken,
} from "../utils/auth.js";
import { signAccessToken } from "../services/token.service.js";
import config from "../config/index.js";
import ms from "ms";

// Helper to get cookie options
function cookieOptions() {
  const isProd = config.server.env === "production";
  const maxAgeMs =
    ms(config.jwt.refreshExpiry || "7d") || 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeMs,
  };
}

// POST /auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const existing = await User.findOne({ email }).lean();
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      plan: "free",
    });

    const userSafe = user.toObject();
    delete userSafe.passwordHash;
    delete userSafe.refreshTokens;

    return res.status(201).json({ success: true, user: userSafe });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // Sign access token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: "user",
    };
    const accessToken = signAccessToken(payload);

    // Create refresh token (raw) and store hashed
    const rawRt = generateRefreshToken();
    const hashed = hashToken(rawRt);
    const expiresAt = new Date(
      Date.now() + (ms(config.jwt.refreshExpiry) || 7 * 24 * 60 * 60 * 1000)
    );

    // Push into user.refreshTokens
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      tokenHash: hashed,
      createdAt: new Date(),
      expiresAt,
      meta: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await user.save();

    // Set refresh cookie
    res.cookie("refresh_token", rawRt, cookieOptions());

    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.refreshTokens;

    return res.json({ success: true, accessToken, user: safe });
  } catch (err) {
    next(err);
  }
}

// POST /auth/refresh
export async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.refresh_token;
    if (!raw)
      return res
        .status(401)
        .json({ success: false, message: "Missing refresh token" });

    const incomingHash = hashToken(raw);

    // Find user that has this token hash and token not expired
    const user = await User.findOne({
      "refreshTokens.tokenHash": incomingHash,
    });
    if (!user) {
      // potential token reuse / theft
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // Find the exact token entry
    const tokenEntry = user.refreshTokens.find(
      (t) => t.tokenHash === incomingHash && new Date(t.expiresAt) > new Date()
    );
    if (!tokenEntry) {
      // token expired or removed
      // remove any matching entries just in case
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.tokenHash !== incomingHash
      );
      await user.save();
      return res
        .status(401)
        .json({ success: false, message: "Refresh token expired or invalid" });
    }

    // Rotation: remove the used token
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.tokenHash !== incomingHash
    );

    // Issue new refresh token
    const newRaw = generateRefreshToken();
    const newHash = hashToken(newRaw);
    const expiresAt = new Date(
      Date.now() + (ms(config.jwt.refreshExpiry) || 7 * 24 * 60 * 60 * 1000)
    );

    user.refreshTokens.push({
      tokenHash: newHash,
      createdAt: new Date(),
      expiresAt,
      meta: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    await user.save();

    // Issue new access token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: "user",
    };
    const accessToken = signAccessToken(payload);

    // Set new cookie
    res.cookie("refresh_token", newRaw, cookieOptions());

    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.refreshTokens;

    return res.json({ success: true, accessToken, user: safe });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout
export async function logout(req, res, next) {
  try {
    const raw = req.cookies?.refresh_token;
    if (!raw) {
      // clear cookie anyway
      res.cookie("refresh_token", "", { ...cookieOptions(), maxAge: 0 });
      return res.json({ success: true });
    }

    const incomingHash = hashToken(raw);
    const user = await User.findOne({
      "refreshTokens.tokenHash": incomingHash,
    });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.tokenHash !== incomingHash
      );
      await user.save();
    }

    // Clear cookie
    res.cookie("refresh_token", "", { ...cookieOptions(), maxAge: 0 });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me
export async function me(req, res, next) {
  try {
    // auth middleware should attach req.user
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    const user = await User.findById(req.user.id).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    delete user.passwordHash;
    delete user.refreshTokens;

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}
