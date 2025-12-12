import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/user.js";

export default async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Missing auth token" });
    }
    const token = header.split(" ")[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // payload.sub is expected to be userId
    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    // Attach basic info; optionally load user doc
    const user = await User.findById(userId).lean();
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found" });

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
    };

    next();
  } catch (err) {
    next(err);
  }
}
