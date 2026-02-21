const mongoose = require("mongoose");
const Course = require("./models/Course");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB",
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const cleanupDuplicates = async () => {
  try {
    await connectDB();

    // Find all courses
    const allCourses = await Course.find().sort({
      institution: 1,
      courseCode: 1,
      createdAt: 1,
    });

    console.log(`\n📊 Total courses in database: ${allCourses.length}\n`);

    if (allCourses.length === 0) {
      console.log("No courses found in database.");
      await mongoose.connection.close();
      return;
    }

    // Display all courses grouped by courseCode
    const coursesByCode = {};
    allCourses.forEach((course) => {
      const key = `${course.institution}|${course.courseCode}`;
      if (!coursesByCode[key]) {
        coursesByCode[key] = [];
      }
      coursesByCode[key].push(course);
    });

    console.log("🔍 Courses by Code:\n");
    Object.entries(coursesByCode).forEach(([key, courses]) => {
      console.log(`${key}: ${courses.length} course(s)`);
      if (courses.length > 1) {
        console.log("   ❌ DUPLICATES FOUND!");
        courses.forEach((c, i) => {
          console.log(`   [${i}] ID: ${c._id} | Created: ${c.createdAt}`);
        });
      }
    });

    // Find duplicates
    const duplicateGroups = Object.entries(coursesByCode).filter(
      ([, courses]) => courses.length > 1,
    );

    if (duplicateGroups.length === 0) {
      console.log("\n✅ No duplicates found!");
      await mongoose.connection.close();
      return;
    }

    console.log(
      `\n⚠️  Found ${duplicateGroups.length} groups with duplicates\n`,
    );

    // Delete duplicates (keep the first one, delete the rest)
    let deletedCount = 0;
    for (const [key, courses] of duplicateGroups) {
      const toKeep = courses[0];
      const toDelete = courses.slice(1);

      console.log(`\nKeeping: ${toKeep._id} (${toKeep.courseCode})`);
      console.log(`Deleting: ${toDelete.map((c) => c._id).join(", ")}`);

      for (const course of toDelete) {
        await Course.deleteOne({ _id: course._id });
        deletedCount++;
      }
    }

    console.log(`\n✅ Deleted ${deletedCount} duplicate course(s)\n`);

    // Show final count
    const finalCount = await Course.countDocuments();
    console.log(`📊 Final course count: ${finalCount}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

cleanupDuplicates();
