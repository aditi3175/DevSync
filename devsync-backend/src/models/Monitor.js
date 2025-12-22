import mongoose from "mongoose";

const { Schema } = mongoose;

const MonitorSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
      default: "GET",
    },
    headers: { type: Schema.Types.Mixed, default: {} },
    body: { type: String, default: null },
    frequencyMinutes: { type: Number, required: true, default: 5 },
    timeoutMs: { type: Number, default: 5000 },
    assertions: { type: [String], default: [] }, // simple assertions like "status==200"
    
    // last known state
    lastStatus: {
      type: String,
      enum: ["up", "down", "unknown"],
      default: "unknown",
    },
    lastResponseTime: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },

    consecutiveFails: { type: Number, default: 0 }, // increments on failure
    alertThreshold: { type: Number, default: 1 }, // send alert only after this many consecutive fails
    lastAlertAt: { type: Date, default: null }, // last time an alert was sent (down or up)

    enabled: { type: Boolean, default: true },
  },

  {
    timestamps: true,
  }
);

// index to help scheduler/queries
MonitorSchema.index({ ownerId: 1, enabled: 1 });

export default mongoose.model("Monitor", MonitorSchema);
