const mongoose = require("mongoose");
const Course = require("./models/Course");
const Department = require("./models/Department");
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

const showCoursesPerDepartment = async () => {
  try {
    await connectDB();

    const departments = await Department.find();
    console.log(`📚 Total Departments: ${departments.length}\n`);

    for (const dept of departments) {
      const courses = await Course.find({
        departmentId: dept._id,
      }).sort({ semester: 1, scheme: 1 });

      console.log(`\n🏫 Department: ${dept.name} (${dept.code})`);
      console.log(`   Institution: ${dept.institution}`);

      if (courses.length === 0) {
        console.log("   ❌ No courses");
      } else {
        console.log(`   ✅ ${courses.length} course(s):`);
        courses.forEach((course) => {
          console.log(
            `      • ${course.courseCode} (Semester ${course.semester}, Scheme ${course.scheme})`,
          );
        });
      }
    }

    console.log("\n");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

showCoursesPerDepartment();
