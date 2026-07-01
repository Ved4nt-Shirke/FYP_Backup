const mongoose = require("mongoose");

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb://127.0.0.1:27017/vidyalankarDB");
    console.log("Connected successfully!");

    const Student = require("./models/Student");

    const totalCount = await Student.countDocuments({});
    console.log("Total students in database:", totalCount);

    const sampleStudents = await Student.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("Latest 10 students uploaded:");
    sampleStudents.forEach((s) => {
      console.log({
        id: s._id,
        studentName: s.studentName,
        rollNo: s.rollNo,
        enrollmentNo: s.enrollmentNo,
        batch: s.batch,
        division: s.division,
        divisionId: s.divisionId,
        academicYear: s.academicYear,
        institution: s.institution,
        createdAt: s.createdAt,
      });
    });

    const divisionGrouping = await Student.aggregate([
      {
        $group: {
          _id: { division: "$division", divisionId: "$divisionId" },
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("Grouping by division:", JSON.stringify(divisionGrouping, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
