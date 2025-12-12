import User from "../models/user.js";

/**
 * GET /api/user/notifications
 * Return current user's notification settings
 * (requires auth middleware which sets req.user)
 */
export async function getNotificationSettings(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      settings: {
        email: user.email,
        alertsEnabled: !!user.alertsEnabled,
        alertOnDown: !!user.alertOnDown,
        alertOnUp: !!user.alertOnUp,
        cooldownMinutes: Number(user.cooldownMinutes || 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/user/notifications
 * Body: { alertsEnabled, alertOnDown, alertOnUp, cooldownMinutes }
 */
export async function updateNotificationSettings(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const { alertsEnabled, alertOnDown, alertOnUp, cooldownMinutes } = req.body;

    if (alertsEnabled !== undefined) user.alertsEnabled = !!alertsEnabled;
    if (alertOnDown !== undefined) user.alertOnDown = !!alertOnDown;
    if (alertOnUp !== undefined) user.alertOnUp = !!alertOnUp;
    if (cooldownMinutes !== undefined) {
      const v = Number(cooldownMinutes);
      if (Number.isNaN(v) || v < 0)
        return res
          .status(400)
          .json({ success: false, message: "Invalid cooldownMinutes" });
      user.cooldownMinutes = v;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Notification settings updated",
      settings: {
        email: user.email,
        alertsEnabled: user.alertsEnabled,
        alertOnDown: user.alertOnDown,
        alertOnUp: user.alertOnUp,
        cooldownMinutes: user.cooldownMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
}
