const mongoose = require("mongoose");
const Ciaan = require("../models/Ciann");
const Course = require("../models/Course");
require("dotenv").config();

async function migrateCourseCode() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vidyalankar",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("Connected to MongoDB");
    console.log("Fetching all Ciaans...");

    const Ciaans = await Ciaan.find({});
    console.log(`Found ${Ciaans.length} Ciaans to update`);

    let updated = 0;
    let failed = 0;

    for (const Ciaan of Ciaans) {
      try {
        // If courseCode is already set, skip
        if (Ciaan.courseCode) {
          console.log(
            `Ciaan ${Ciaan.CiaanId}: Already has courseCode ${Ciaan.courseCode}`,
          );
          continue;
        }

        let courseCode = null;

        // Try to find course by courseId if it exists
        if (Ciaan.courseId) {
          const course = await Course.findById(Ciaan.courseId);
          if (course) {
            courseCode = course.courseCode;
            console.log(
              `Ciaan ${Ciaan.CiaanId}: Found courseCode from courseId: ${courseCode}`,
            );
          }
        }

        // If not found by courseId, try to find by semester and department
        if (!courseCode && Ciaan.semester && Ciaan.department) {
          const courses = await Course.find({
            semester: parseInt(Ciaan.semester),
            departmentId: Ciaan.department._id || Ciaan.department,
          });

          if (courses.length > 0) {
            // Use the first course's courseCode
            courseCode = courses[0].courseCode;
            Ciaan.courseId = courses[0]._id;
            console.log(
              `Ciaan ${Ciaan.CiaanId}: Found courseCode by semester: ${courseCode}`,
            );
          }
        }

        if (courseCode) {
          // Update the Ciaan
          await Ciaan.findByIdAndUpdate(
            Ciaan._id,
            { courseCode, courseId: Ciaan.courseId || undefined },
            { new: true },
          );
          updated++;
          console.log(
            `✓ Updated Ciaan ${Ciaan.CiaanId} with courseCode: ${courseCode}`,
          );
        } else {
          console.log(`✗ Could not find courseCode for Ciaan ${Ciaan.CiaanId}`);
          failed++;
        }
      } catch (err) {
        console.error(`Error processing Ciaan ${Ciaan.CiaanId}:`, err.message);
        failed++;
      }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${Ciaans.length}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateCourseCode();
