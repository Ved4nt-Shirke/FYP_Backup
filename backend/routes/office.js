const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const User = require("../models/user");
const OfficeStaff = require("../models/OfficeStaff");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate, authorizeOffice } = require("../middleware/auth");

// ============================================
// OFFICE STAFF ENDPOINTS - All require auth
// ============================================

/**
 * GET /api/office/dashboard-summary
 * Get summary statistics for office dashboard
 * Auth: Office staff or admin
 */
router.get("/dashboard-summary", authenticate, authorizeOffice, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalDivisions = await Student.distinct("division", {
      division: { $ne: "", $exists: true },
    }).then((divs) => divs.filter((d) => d).length);
    const totalBatches = await Student.distinct("batch");

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalDivisions,
        totalBatches: totalBatches.length,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard summary:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/office/students
 * Get all students for office staff (with auth)
 * Auth: Office staff or admin
 * Query: ?batch=value&division=value
 */
router.get("/students", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { batch, division } = req.query;
    let query = {};

    if (batch) {
      query.batch = batch;
    }
    if (division) {
      query.division = division;
    }

    const students = await Student.find(query);
    res.json({ success: true, students });
  } catch (err) {
    console.error("Error fetching office students:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/office/divisions
 * Get all divisions (with auth)
 * Auth: Office staff or admin
 */
router.get("/divisions", authenticate, authorizeOffice, async (req, res) => {
  try {
    const divisions = await Student.distinct("division", {
      division: { $ne: "", $exists: true },
    });
    res.json({
      success: true,
      divisions: divisions.filter((d) => d),
    });
  } catch (err) {
    console.error("Error fetching divisions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/office/batches
 * Get all batches (with auth)
 * Auth: Office staff or admin
 */
router.get("/batches", authenticate, authorizeOffice, async (req, res) => {
  try {
    const batches = await Student.distinct("batch");
    res.json({
      success: true,
      batches: batches.filter((b) => b),
    });
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/office/export-credentials
 * Export student credentials as data (for office staff use)
 * Auth: Office staff or admin
 * Body: { division?: string, batch?: string }
 */
router.post("/export-credentials", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { division, batch } = req.body;
    let query = {};

    if (division) {
      query.division = division;
    }
    if (batch) {
      query.batch = batch;
    }

    const students = await Student.find(query);

    const credentials = students
      .filter((s) => s.username && s.plainPassword)
      .map((s) => ({
        enrollmentNo: s.enrollmentNo,
        studentName: s.studentName,
        username: s.username,
        plainPassword: s.plainPassword,
        batch: s.batch,
        division: s.division,
      }));

    res.json({
      success: true,
      count: credentials.length,
      credentials,
    });
  } catch (err) {
    console.error("Error exporting credentials:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/office/regenerate-password/:studentId
 * Regenerate password for a student (office staff only)
 * Auth: Office staff or admin
 */
router.post(
  "/regenerate-password/:studentId",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.studentId);

      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      // Generate new password
      const newPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update student record
      student.plainPassword = newPassword;
      await student.save();

      // Update user account
      const user = await User.findOne({ username: student.username });
      if (user) {
        user.password = hashedPassword;
        await user.save();
      }

      res.json({
        success: true,
        message: "Password regenerated successfully",
        studentName: student.studentName,
        username: student.username,
        plainPassword: newPassword,
      });
    } catch (err) {
      console.error("Error regenerating password:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * GET /api/office/student/:id
 * Get specific student details (with auth)
 * Auth: Office staff or admin
 */
router.get("/student/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/office/bulk-import
 * Bulk import students with automatic credential generation
 * Auth: Office staff or admin
 * Body: { students: [{ rollNo, enrollmentNo, studentName, batch, division }] }
 */
router.post("/bulk-import", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid students array",
      });
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [],
      generatedCredentials: [],
    };

    for (const studentData of students) {
      const { rollNo, enrollmentNo, studentName, batch, division } = studentData;

      // Validate required fields
      if (!rollNo || !enrollmentNo || !studentName || !batch) {
        results.skipped++;
        results.errors.push({
          enrollmentNo,
          error: "Missing required fields",
        });
        continue;
      }

      try {
        // Check if student already exists
        const existingStudent = await Student.findOne({
          $or: [{ rollNo }, { enrollmentNo }],
        });

        if (existingStudent) {
          results.skipped++;
          results.errors.push({
            enrollmentNo,
            error: "Student already exists",
          });
          continue;
        }

        // Generate credentials
        const username = enrollmentNo.toLowerCase().replace(/[^a-z0-9]/g, "");
        const plainPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Create student record
        const newStudent = new Student({
          rollNo,
          enrollmentNo,
          studentName,
          batch,
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
      } catch (error) {
        results.errors.push({
          enrollmentNo,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/office/student/:id
 * Update student information (office staff only)
 * Auth: Office staff or admin
 */
router.put("/student/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { rollNo, enrollmentNo, studentName, batch, division } = req.body;

    if (!studentName || !rollNo || !enrollmentNo || !batch) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { rollNo, enrollmentNo, studentName, batch, division: division || "" },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/office/student/:id
 * Delete student (office staff only)
 * Auth: Office staff or admin
 */
router.delete("/student/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Delete associated user account
    if (student.username) {
      await User.findOneAndDelete({ username: student.username });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Student deleted successfully",
      studentName: student.studentName,
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
