const mongoose = require("mongoose");
require("dotenv").config();
const Course = require("./models/Course");
const Department = require("./models/Department");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✓ MongoDB Connected");

    // Find all courses
    const courses = await Course.find({}).populate("departmentId");
    console.log(`\nTotal courses found: ${courses.length}`);

    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. Course:`);
      console.log(`   Code: ${course.courseCode}`);
      console.log(`   Year: ${course.courseYear}`);
      console.log(`   Semester: ${course.courseSemester}`);
      console.log(`   Department: ${course.departmentId?.name || "N/A"}`);
      console.log(`   Institution: ${course.institution}`);
    });

    // Check for CO department
    const coDept = await Department.findOne({ code: "CO" });
    if (coDept) {
      console.log("\n\n=== CO Department Found ===");
      console.log(`Department ID: ${coDept._id}`);
      console.log(`Department Name: ${coDept.name}`);

      const coCourses = await Course.find({ departmentId: coDept._id });
      console.log(`\nCourses in CO department: ${coCourses.length}`);
      coCourses.forEach((c) => {
        console.log(
          `  - ${c.courseCode} (Year ${c.courseYear}, Sem ${c.courseSemester})`,
        );
      });
    } else {
      console.log("\n\n⚠ CO Department NOT found");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
