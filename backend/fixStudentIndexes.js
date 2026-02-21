const mongoose = require("mongoose");
require("dotenv").config();

async function fixStudentIndexes() {
  try {
    console.log("🔧 Fixing Student collection indexes...");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    const Student = require("./models/Student");
    const Department = require("./models/Department");
    const Course = require("./models/Course");
    const Division = require("./models/Division");

    // Backfill institution for existing students
    console.log("\n🧩 Backfilling student institutions...");
    const missingInstitutionQuery = {
      $or: [
        { institution: { $exists: false } },
        { institution: null },
        { institution: "" },
      ],
    };

    let updatedCount = 0;
    let skippedCount = 0;
    const cursor = Student.find(missingInstitutionQuery).cursor();
    for await (const student of cursor) {
      let institution = null;

      if (student.departmentId) {
        const department = await Department.findById(student.departmentId);
        institution = department?.institution || null;
      }

      if (!institution && student.courseId) {
        const course = await Course.findById(student.courseId);
        institution = course?.institution || null;
      }

      if (!institution && student.divisionId) {
        const division = await Division.findById(student.divisionId);
        institution = division?.institution || null;
      }

      if (!institution) {
        skippedCount++;
        continue;
      }

      await Student.updateOne({ _id: student._id }, { $set: { institution } });
      updatedCount++;
    }

    console.log(
      `✓ Institution backfill complete: ${updatedCount} updated, ${skippedCount} skipped`,
    );

    // Get existing indexes
    const indexes = await Student.collection.getIndexes();
    console.log("\n📋 Current indexes:");
    console.log(indexes);

    // Drop indexes tied to enrollment/roll numbers
    const indexesToDrop = [];
    for (const [indexName, indexSpec] of Object.entries(indexes)) {
      if (indexName === "_id_") continue; // Don't drop the _id index

      const indexKeys = Object.keys(indexSpec.key || {});
      if (indexKeys.includes("enrollmentNo") || indexKeys.includes("rollNo")) {
        indexesToDrop.push(indexName);
      }
    }

    // Drop indexes
    for (const indexName of indexesToDrop) {
      console.log(`\n🗑️  Dropping index: ${indexName}`);
      await Student.collection.dropIndex(indexName);
      console.log(`✓ Dropped ${indexName}`);
    }

    // Create new compound indexes
    console.log("\n📝 Creating new compound indexes...");

    await Student.collection.createIndex(
      { enrollmentNo: 1, institution: 1 },
      { unique: true },
    );
    console.log("✓ Created index: enrollmentNo_1_institution_1 (unique)");

    await Student.collection.createIndex(
      { rollNo: 1, institution: 1 },
      { unique: true },
    );
    console.log("✓ Created index: rollNo_1_institution_1 (unique)");

    // Get final indexes
    const finalIndexes = await Student.collection.getIndexes();
    console.log("\n📋 Final indexes:");
    console.log(finalIndexes);

    console.log("\n✅ Student indexes fixed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing indexes:", err.message);
    process.exit(1);
  }
}

fixStudentIndexes();
