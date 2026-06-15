const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate, authorizeOffice } = require("../middleware/auth");

const generateSafePassword = (length = 8) => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


// GET all students with optional filters - Public endpoint (for office panel)
// Note: Office staff access is controlled via authorization in the frontend
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/students - Request received");
    const { batch, division, divisionId, courseId, departmentId, academicYear } = req.query;
    console.log("Query params:", req.query);

    // Build query object
    let query = {};
    if (batch) {
      query.batch = batch;
    }
    if (divisionId) {
      query.divisionId = divisionId;
    } else if (division) {
      query.division = division;
    }
    if (courseId) {
      query.courseId = courseId;
    }
    if (departmentId) {
      query.departmentId = departmentId;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }

    console.log("Database query:", query);

    // Fetch students with populated related data
    const students = await Student.find(query)
      .populate("departmentId", "name code")
      .populate("courseId", "name semester class")
      .populate("divisionId", "name")
      .select(
        "rollNo studentName enrollmentNo batch academicYear division departmentId courseId divisionId",
      )
      .lean()
      .exec();

    console.log("Students found:", students.length);

    // Enrich response with flattened data for easier frontend consumption
    const enrichedStudents = students.map((student) => ({
      ...student,
      departmentName: student.departmentId?.name || "",
      departmentCode: student.departmentId?.code || "",
      courseName: student.courseId?.name || "",
      semester: student.courseId?.semester || "",
      className: student.courseId?.class || "",
      divisionName: student.divisionId?.name || student.division,
    }));

    res.json(enrichedStudents);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET divisions
router.get("/divisions", async (req, res) => {
  try {
    const divisions = await Student.distinct("division", {
      division: { $ne: "", $exists: true },
    });
    res.json({ divisions: divisions.filter((d) => d) });
  } catch (err) {
    console.error("Error fetching divisions:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST bulk upload students
router.post("/bulk", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { students, academicYear } = req.body;

    const results = {
      inserted: 0,
      skipped: 0,
      generatedCredentials: [],
    };

    for (const studentData of students) {
      const { rollNo, enrollmentNo, studentName, batch, division } =
        studentData;

      // Check if student already exists
      const existingStudent = await Student.findOne({
        $or: [{ rollNo: rollNo }, { enrollmentNo: enrollmentNo }],
      });

      if (existingStudent) {
        results.skipped++;
        continue;
      }

      // Generate username and password
      const username = enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, "");
      const plainPassword = generateSafePassword(8);

      // Hash password for user account
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create student record
      const newStudent = new Student({
        rollNo,
        enrollmentNo,
        studentName,
        batch,
        academicYear: (academicYear || "").toString().trim(),
        division: division || "",
        username,
        plainPassword,
      });

      await newStudent.save();

      // Create user account for student
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        const newUser = new User({
          username,
          password: hashedPassword,
          college: req.user.college,
          role: "student",
        });
        await newUser.save();
      }

      results.inserted++;
      results.generatedCredentials.push({
        enrollmentNo,
        studentName,
        username,
        plainPassword,
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT update student
router.put("/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { rollNo, enrollmentNo, studentName, batch, academicYear, division, aadhaarNo } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        rollNo,
        enrollmentNo,
        studentName,
        batch,
        academicYear: (academicYear || "").toString().trim(),
        division: division || "",
        aadhaarNo: (aadhaarNo || "").toString().trim(),
      },
      { new: true },
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ student: updatedStudent });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE student
router.delete("/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete associated user account if exists
    if (student.username) {
      await User.findOneAndDelete({ username: student.username });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
