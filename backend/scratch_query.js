const mongoose = require("mongoose");
require("dotenv").config();
const Division = require("./models/Division");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Subject = require("./models/Subject");
const Ciann = require("./models/Ciann");
const Faculty = require("./models/Faculty");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(async () => {
    console.log("Connected to MongoDB");

    const faculty = await Faculty.find({});
    console.log("FACULTY IN DATABASE:");
    console.log(faculty);

    const academicYear = "2025-26";
    const semester = "5";
    const departmentId = "69db8810f900bd3e85601fe0";
    const divisionId = "69db8824f900bd3e85602054";
    const ciannId = "8353";

    // 1. Fetch division
    const divisionObj = await Division.findById(divisionId);
    console.log("Division found:", divisionObj?.name);

    // 2. Fetch students
    const students = await Student.find({ departmentId, divisionId }).sort({ rollNo: 1 });
    console.log("Students found:", students.length);

    // 3. Find courses
    const semNum = parseInt(semester);
    const courses = await Course.find({
      departmentId,
      $or: [{ semester: semNum }, { semester: semester }]
    });
    console.log("Courses found:", courses.map(c => c._id));
    const courseIds = courses.map(c => c._id);

    // 4. Find subjects
    let subjects = [];
    let targetCiann = null;
    if (ciannId) {
      targetCiann = await Ciann.findOne({ ciannId: Number(ciannId) });
      console.log("Target Ciann subject:", targetCiann?.subject);
      if (targetCiann) {
        subjects = await Subject.find({
          courseId: { $in: courseIds },
          $or: [
            { code: targetCiann.subject?.code },
            { name: targetCiann.subject?.name }
          ]
        });
      }
    }
    console.log("Subjects found with query:", subjects.map(s => `${s.name} (${s.code})`));

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
