const mongoose = require("mongoose");
const Course = require("./models/Course");
const Division = require("./models/Division");
const Subject = require("./models/Subject");
const Student = require("./models/Student");
const Ciann = require("./models/Ciann");
const TheoryAttendance = require("./models/TheoryAttendance");
const PracticalAttendance = require("./models/PracticalAttendance");
const TutorialAttendance = require("./models/TutorialAttendance");
const ExtraAttendance = require("./models/ExtraAttendance");
const ExtraPract = require("./models/ExtraPract");
const PracticalExam = require("./models/PracticalExam");
const Assessment = require("./models/Assessment");
const CTMarks = require("./models/CTMarks");
const StudentResult = require("./models/StudentResult");
const LabPlanning = require("./models/LabPlanning");
const CourseChapter = require("./models/CourseChapter");
const TeachingPlan = require("./models/TeachingPlan");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB",
    );
    console.log("Connected to MongoDB\n");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const showCascadeDeletePreview = async () => {
  try {
    await connectDB();

    const courses = await Course.find();

    if (courses.length === 0) {
      console.log("📌 No courses found in database.\n");
      await mongoose.connection.close();
      return;
    }

    console.log(
      `📊 Course Deletion Impact Analysis for ${courses.length} course(s)\n`,
    );
    console.log("═".repeat(70));

    for (const course of courses) {
      console.log(
        `\n🏫 Course: ${course.courseCode} (${course._id})\n   Institute: ${course.institution}`,
      );

      const divisions = await Division.countDocuments({ courseId: course._id });
      const subjects = await Subject.countDocuments({ courseId: course._id });
      const students = await Student.countDocuments({ courseId: course._id });
      const cianns = await Ciann.countDocuments({ courseId: course._id });
      const theoryAttendance = await TheoryAttendance.countDocuments({
        courseId: course._id,
      });
      const practicalAttendance = await PracticalAttendance.countDocuments({
        courseId: course._id,
      });
      const tutorialAttendance = await TutorialAttendance.countDocuments({
        courseId: course._id,
      });
      const extraAttendance = await ExtraAttendance.countDocuments({
        courseId: course._id,
      });
      const extraPract = await ExtraPract.countDocuments({
        courseId: course._id,
      });
      const practicalExams = await PracticalExam.countDocuments({
        courseId: course._id,
      });
      const assessments = await Assessment.countDocuments({
        courseId: course._id,
      });
      const ctMarks = await CTMarks.countDocuments({ courseId: course._id });
      const studentResults = await StudentResult.countDocuments({
        courseId: course._id,
      });
      const labPlanning = await LabPlanning.countDocuments({
        courseId: course._id,
      });
      const courseChapters = await CourseChapter.countDocuments({
        courseId: course._id,
      });
      const teachingPlans = await TeachingPlan.countDocuments({
        courseId: course._id,
      });

      console.log(`\n   📋 Will Delete:\n`);
      if (divisions > 0) console.log(`      • ${divisions} Division(s)`);
      if (subjects > 0) console.log(`      • ${subjects} Subject(s)`);
      if (students > 0) console.log(`      • ${students} Student(s)`);
      if (cianns > 0) console.log(`      • ${cianns} CIANN Record(s)`);
      if (theoryAttendance > 0)
        console.log(`      • ${theoryAttendance} Theory Attendance Record(s)`);
      if (practicalAttendance > 0)
        console.log(
          `      • ${practicalAttendance} Practical Attendance Record(s)`,
        );
      if (tutorialAttendance > 0)
        console.log(
          `      • ${tutorialAttendance} Tutorial Attendance Record(s)`,
        );
      if (extraAttendance > 0)
        console.log(`      • ${extraAttendance} Extra Attendance Record(s)`);
      if (extraPract > 0)
        console.log(`      • ${extraPract} Extra Practical Record(s)`);
      if (practicalExams > 0)
        console.log(`      • ${practicalExams} Practical Exam(s)`);
      if (assessments > 0) console.log(`      • ${assessments} Assessment(s)`);
      if (ctMarks > 0) console.log(`      • ${ctMarks} CT Mark Record(s)`);
      if (studentResults > 0)
        console.log(`      • ${studentResults} Student Result(s)`);
      if (labPlanning > 0)
        console.log(`      • ${labPlanning} Lab Planning Record(s)`);
      if (courseChapters > 0)
        console.log(`      • ${courseChapters} Course Chapter(s)`);
      if (teachingPlans > 0)
        console.log(`      • ${teachingPlans} Teaching Plan(s)`);

      const totalItems =
        divisions +
        subjects +
        students +
        cianns +
        theoryAttendance +
        practicalAttendance +
        tutorialAttendance +
        extraAttendance +
        extraPract +
        practicalExams +
        assessments +
        ctMarks +
        studentResults +
        labPlanning +
        courseChapters +
        teachingPlans;

      if (totalItems === 0) {
        console.log(`      • (No related data - course only)`);
      }

      console.log(`\n   ✅ Total items to delete: ${totalItems + 1}`);
    }

    console.log("\n" + "═".repeat(70) + "\n");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

showCascadeDeletePreview();
