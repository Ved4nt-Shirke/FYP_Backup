const express = require("express");
const router = express.Router();
const SaPrK4 = require("../models/SaPrK4");

// GET SA-PR K4 record by CIANN + division
router.get("/sa-pr-k4", async (req, res) => {
  try {
    const { ciannId, division } = req.query;

    if (!ciannId || !division) {
      return res
        .status(400)
        .json({ success: false, message: "ciannId and division are required" });
    }

    const record = await SaPrK4.findOne({
      ciannId: Number(ciannId),
      division: String(division),
    });

    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE/UPDATE SA-PR K4 record
router.post("/sa-pr-k4/save", async (req, res) => {
  try {
    const {
      ciannId,
      subjectName,
      subjectCode,
      courseCode,
      academicYear,
      division,
      examDate,
      maxMarks,
      minMarks,
      students,
    } = req.body;

    if (!ciannId || !division || !subjectName || maxMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "ciannId, division, subjectName, and maxMarks are required",
      });
    }

    if (!Array.isArray(students)) {
      return res
        .status(400)
        .json({ success: false, message: "students must be an array" });
    }

    const sanitizedStudents = students.map((student) => ({
      studentId: student.studentId || undefined,
      rollNo: student.rollNo || "",
      enrollmentNo: student.enrollmentNo || "",
      studentName: student.studentName || "",
      seatNo: student.seatNo || "",
      marks:
        student.marks === "" || student.marks === null
          ? undefined
          : Number(student.marks),
    }));

    const update = {
      ciannId: Number(ciannId),
      subjectName: String(subjectName),
      subjectCode: subjectCode ? String(subjectCode) : "",
      courseCode: courseCode ? String(courseCode) : "",
      academicYear: academicYear ? String(academicYear) : "",
      division: String(division),
      examDate: examDate ? new Date(examDate) : undefined,
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks || 0),
      owner: req.user?._id,
      ownerUsername: req.user?.userName || req.user?.username || "",
      students: sanitizedStudents,
    };

    const record = await SaPrK4.findOneAndUpdate(
      { ciannId: Number(ciannId), division: String(division) },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
