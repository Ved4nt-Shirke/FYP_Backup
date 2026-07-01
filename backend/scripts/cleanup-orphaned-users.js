/**
 * Cleanup script: Find and delete orphaned User documents
 * whose username doesn't match any Faculty.generatedUsername
 * or OfficeStaff.generatedUsername (excluding admins, superadmins, and students).
 */
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/user");
const Faculty = require("../models/Faculty");
const OfficeStaff = require("../models/OfficeStaff");
const Student = require("../models/Student");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vidyalankarDB";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Get all faculty/hod/coordinator users (non-admin, non-superadmin, non-student, non-office)
    const facultyUsers = await User.find({
      role: { $in: ["faculty", "hod", "academic_coordinator"] },
    }).lean();

    const officeUsers = await User.find({ role: "office" }).lean();

    // 2. Get all active Faculty generatedUsernames
    const allFacultyUsernames = (
      await Faculty.find({}, "generatedUsername").lean()
    ).map((f) => f.generatedUsername);

    // 3. Get all active OfficeStaff generatedUsernames
    const allOfficeUsernames = (
      await OfficeStaff.find({}, "generatedUsername").lean()
    ).map((o) => o.generatedUsername);

    // 4. Find orphaned faculty users
    const orphanedFacultyUsers = facultyUsers.filter(
      (u) => !allFacultyUsernames.includes(u.username)
    );

    // 5. Find orphaned office users
    const orphanedOfficeUsers = officeUsers.filter(
      (u) => !allOfficeUsernames.includes(u.username)
    );

    const allOrphaned = [...orphanedFacultyUsers, ...orphanedOfficeUsers];

    if (allOrphaned.length === 0) {
      console.log("\n✅ No orphaned User documents found. Database is clean.");
    } else {
      console.log(`\n⚠️  Found ${allOrphaned.length} orphaned User document(s):\n`);
      allOrphaned.forEach((u) => {
        console.log(`  - username: "${u.username}" | role: ${u.role} | college: ${u.college}`);
      });

      // Delete them
      const orphanedIds = allOrphaned.map((u) => u._id);
      const result = await User.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`\n🗑️  Deleted ${result.deletedCount} orphaned User document(s).`);
    }

    await mongoose.disconnect();
    console.log("\nDone.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

cleanup();
