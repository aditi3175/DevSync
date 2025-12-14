import mongoose from "mongoose";

const { Schema } = mongoose;

const CheckHistorySchema = new Schema(
  {
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
      index: true,
    },
    statusCode: { type: Number, default: null },
    responseTimeMs: { type: Number, default: null },
    ok: { type: Boolean, required: true, default: false },
    bodyHash: { type: String, default: null },
    responseSnippet: { type: String, default: null },
    error: { type: String, default: null },
    checkedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CheckHistory", CheckHistorySchema);
