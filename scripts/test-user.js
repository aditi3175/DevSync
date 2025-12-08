// scripts/test-user.js
import mongoose from "mongoose";
import config from "../src/config/index.js";
import { connectDB, closeDB } from "../src/config/db.js";
import User from "../src/models/user.js";

async function run() {
  console.log("⏳ Connecting to MongoDB...");
  await connectDB();

  try {
    // Remove existing test user (safe cleanup)
    await User.deleteOne({ email: "testuser@example.com" });

    console.log("🧪 Creating test user...");
    const newUser = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      passwordHash: "dummyHashValue123", // sirf TEST — actual app me hash use karna
      plan: "free",
    });

    console.log("✅ User created:");
    console.log(newUser); // passwordHash hidden because of toJSON transform

    console.log("\n🔍 Fetching User from DB…");
    const fetched = await User.findOne({ email: "testuser@example.com" });

    console.log("📄 User fetched:");
    console.log(fetched);

    console.log("\n🔐 Fetching WITH passwordHash for login test...");
    const fetchedWithPassword = await User.findOne({
      email: "testuser@example.com",
    }).select("+passwordHash");

    console.log("➡️ User with passwordHash:");
    console.log(fetchedWithPassword);

    console.log("\n🎉 Test complete. User model is working correctly.");
  } catch (err) {
    console.error("❌ Error during user test:", err);
  }

  await closeDB();
  console.log("🔌 DB closed. Exiting.");
  process.exit(0);
}

run();
