import mongoose from "mongoose";

const NotificationLogSchema = new mongoose.Schema(
  {
    checkRunId: { type: String, index: true },
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitor" },
    type: { type: String, enum: ["monitor-down", "monitor-up"] },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("NotificationLog", NotificationLogSchema);
