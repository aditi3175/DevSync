import mongoose from "mongoose";

const CheckRunSchema = new mongoose.Schema(
  {
    checkRunId: { type: String, unique: true, index: true },
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitor" },
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("CheckRun", CheckRunSchema);
