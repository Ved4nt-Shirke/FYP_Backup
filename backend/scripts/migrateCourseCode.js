const mongoose = require("mongoose");
const Ciann = require("../models/Ciann");
const Course = require("../models/Course");
require("dotenv").config();

async function migrateCourseCode() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/vidyalankar",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("Connected to MongoDB");
    console.log("Fetching all CIANNs...");

    const cianns = await Ciann.find({});
    console.log(`Found ${cianns.length} CIANNs to update`);

    let updated = 0;
    let failed = 0;

    for (const ciann of cianns) {
      try {
        // If courseCode is already set, skip
        if (ciann.courseCode) {
          console.log(
            `CIANN ${ciann.ciannId}: Already has courseCode ${ciann.courseCode}`,
          );
          continue;
        }

        let courseCode = null;

        // Try to find course by courseId if it exists
        if (ciann.courseId) {
          const course = await Course.findById(ciann.courseId);
          if (course) {
            courseCode = course.courseCode;
            console.log(
              `CIANN ${ciann.ciannId}: Found courseCode from courseId: ${courseCode}`,
            );
          }
        }

        // If not found by courseId, try to find by semester and department
        if (!courseCode && ciann.semester && ciann.department) {
          const courses = await Course.find({
            semester: parseInt(ciann.semester),
            departmentId: ciann.department._id || ciann.department,
          });

          if (courses.length > 0) {
            // Use the first course's courseCode
            courseCode = courses[0].courseCode;
            ciann.courseId = courses[0]._id;
            console.log(
              `CIANN ${ciann.ciannId}: Found courseCode by semester: ${courseCode}`,
            );
          }
        }

        if (courseCode) {
          // Update the CIANN
          await Ciann.findByIdAndUpdate(
            ciann._id,
            { courseCode, courseId: ciann.courseId || undefined },
            { new: true },
          );
          updated++;
          console.log(
            `✓ Updated CIANN ${ciann.ciannId} with courseCode: ${courseCode}`,
          );
        } else {
          console.log(`✗ Could not find courseCode for CIANN ${ciann.ciannId}`);
          failed++;
        }
      } catch (err) {
        console.error(`Error processing CIANN ${ciann.ciannId}:`, err.message);
        failed++;
      }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${cianns.length}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateCourseCode();
