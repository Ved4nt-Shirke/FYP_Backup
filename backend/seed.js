const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const Institution = require("./models/Institution");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to DB for seeding...");
    seedUsers();
  })
  .catch((err) => console.error("DB connection error:", err));

async function seedUsers() {
  try {
    // Do NOT clear all users. Only upsert the superadmin.
    const superadminUsername = process.env.SUPERADMIN_USERNAME || "superadmin";
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || "superadmin123";

    const hashed = await bcrypt.hash(superadminPassword, 10);

    // Upsert superadmin without touching other users
    await User.findOneAndUpdate(
      { username: superadminUsername, role: "superadmin", college: "ALL" },
      { username: superadminUsername, password: hashed, college: "ALL", role: "superadmin" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(
      "✅ Super admin ensured. Existing admin/faculty/student users are preserved."
    );
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding superadmin:", err);
    process.exit(1);
  }
}