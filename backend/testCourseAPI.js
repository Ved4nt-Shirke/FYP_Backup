const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();
const Course = require("./models/Course");
const Department = require("./models/Department");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✓ MongoDB Connected\n");

    // Find CO department
    const coDept = await Department.findOne({ code: "CO" });

    if (!coDept) {
      console.log("❌ CO Department not found");
      process.exit(1);
    }

    console.log("=== CO Department ===");
    console.log(`ID: ${coDept._id}`);
    console.log(`Name: ${coDept.name}`);
    console.log(`Code: ${coDept.code}`);
    console.log(`Institution: ${coDept.institution}\n`);

    // Query courses like the API does
    const departmentId = coDept._id;
    const institution = coDept.institution;

    console.log("=== Querying Courses ===");
    console.log(
      `Query: { departmentId: ${departmentId}, institution: "${institution}" }\n`,
    );

    const courses = await Course.find({
      departmentId: departmentId,
      institution: institution,
    }).sort({ courseCode: 1 });

    console.log(`Found ${courses.length} course(s):\n`);

    courses.forEach((course, i) => {
      console.log(`${i + 1}. Course Object:`);
      console.log(`   _id: ${course._id}`);
      console.log(`   courseCode: ${course.courseCode}`);
      console.log(`   courseYear: ${course.courseYear}`);
      console.log(`   courseSemester: ${course.courseSemester}`);
      console.log(`   departmentId: ${course.departmentId}`);
      console.log(`   institution: ${course.institution}`);
      console.log();
    });

    // Show what the API would return
    console.log("=== API Response Would Be ===");
    console.log(
      JSON.stringify(
        {
          success: true,
          courses: courses,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
