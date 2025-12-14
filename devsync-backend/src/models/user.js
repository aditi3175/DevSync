import mongoose from "mongoose";

const { Schema } = mongoose;

const RefreshTokenSchema = new Schema(
  {
    //store hashed/opaque refresh token identifiers (not raw token)
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    // optional: device info, ip, userAgent for audits
    meta: {
      ip: { type: String },
      userAgent: { type: String },
    },
  },
  { _id: false } // keep as subdocument without separate id
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    // store only hashed password, do not expose by default
    passwordHash: { type: String, required: true, select: false },

    // simple plan field (extendable)
    plan: { type: String, enum: ["free", "pro"], default: "free" },

    // optional array to track issued refresh tokens (hashed)
    refreshTokens: { type: [RefreshTokenSchema], default: [] },

    // optional flags
    isEmailVerified: { type: Boolean, default: false },

    // NEW: Notification preferences
    alertsEnabled: { type: Boolean, default: true },
    alertOnDown: { type: Boolean, default: true },
    alertOnUp: { type: Boolean, default: true },
    cooldownMinutes: { type: Number, default: 10 }, // No more than 1 email every 10 mins
  },
  {
    timestamps: true,
    toJSON: {
      // remove sensitive fields when converting to JSON
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
