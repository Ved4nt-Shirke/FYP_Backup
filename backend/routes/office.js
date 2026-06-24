const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Student = require("../models/Student");
const { ensureStudentHistory, resolveStudents } = require("../utils/studentHistoryHelper");
const { generateUniqueUsername } = require("../utils/usernameGenerator");
const User = require("../models/user");
const OfficeStaff = require("../models/OfficeStaff");
const Notice = require("../models/Notice");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Institution = require("../models/Institution");
const Faculty = require("../models/Faculty");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate, authorizeOffice } = require("../middleware/auth");


const generateSafePassword = () => {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const institutionFilter = (institutionCode = "") => ({
  $regex: new RegExp(`^${escapeRegex(String(institutionCode || "").trim())}$`, "i"),
});

// ============================================
// OFFICE STAFF ENDPOINTS - All require auth
// ============================================

router.get("/theme", authenticate, authorizeOffice, async (req, res) => {
  try {
    const college = req.user?.college;
    if (!college || college === "ALL") {
      return res.status(400).json({
        success: false,
        message: "Invalid institution context",
      });
    }

    const institution = await Institution.findOne(
      { code: college },
      "name code palette logoUrl",
    );

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    return res.json({
      success: true,
      institution,
    });
  } catch (err) {
    console.error("Error fetching office theme:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/office/dashboard-summary
 * Get summary statistics for office dashboard
 * Auth: Office staff or admin
 */
router.get(
  "/dashboard-summary",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const totalStudents = await Student.countDocuments({ institution: req.user.college });
      const totalDivisions = await Student.distinct("division", {
        institution: req.user.college,
        division: { $ne: "", $exists: true },
      }).then((divs) => divs.filter((d) => d).length);
      const totalBatches = await Student.distinct("batch", { institution: req.user.college });

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
  },
);

/**
 * GET /api/office/students
 * Get all students for office staff (with auth)
 * Auth: Office staff or admin
 * Query: ?batch=value&division=value&departmentId=value&courseId=value&divisionId=value
 */
router.get("/students", authenticate, authorizeOffice, async (req, res) => {
  try {
    console.log("GET /api/office/students - Request received with query:", req.query);
    const students = await resolveStudents(req.query, req.user.college);
    res.json({ success: true, students, filterHint: null });
  } catch (err) {
    console.error("Error fetching office students:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/office/students
 * Clear students (and associated user accounts) with optional filters
 * Auth: Office staff or admin
 * Body: { departmentId?, courseId?, divisionId?, batch? }
 */
router.delete("/students", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { departmentId, courseId, divisionId, batch, academicYear } = req.body || {};
    const query = { institution: req.user.college };

    if (departmentId) query.departmentId = departmentId;
    if (courseId) query.courseId = courseId;
    if (divisionId) query.divisionId = divisionId;
    if (batch) query.batch = batch;
    if (academicYear) query.academicYear = academicYear;

    const matchedStudents = await Student.find(query).select("username");
    const usernames = matchedStudents
      .map((student) => student.username)
      .filter(Boolean);

    const studentDeleteResult = await Student.deleteMany(query);
    let deletedUsers = 0;

    if (usernames.length > 0) {
      const userDeleteResult = await User.deleteMany({
        username: { $in: usernames },
      });
      deletedUsers = userDeleteResult.deletedCount || 0;
    }

    return res.json({
      success: true,
      deletedStudents: studentDeleteResult.deletedCount || 0,
      deletedUsers,
      message: "Student database cleared successfully",
    });
  } catch (error) {
    console.error("Clear student DB error:", error);
    return res.status(500).json({ success: false, message: error.message });
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
      institution: req.user.college,
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
    const batches = await Student.distinct("batch", { institution: req.user.college });
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
 * GET /api/office/departments
 * Get all departments from Admin Panel
 * Auth: Office staff or admin
 */
router.get("/departments", authenticate, authorizeOffice, async (req, res) => {
  try {
    const institution = String(req.user?.college || "").trim();
    const departments = await Department.find({
      institution: institutionFilter(institution),
    })
      .sort({ name: 1 })
      .select("_id name code");

    res.json({
      success: true,
      departments,
    });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/office/courses/:departmentId
 * Get courses for a specific department
 * Auth: Office staff or admin
 */
router.get(
  "/courses/:departmentId",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const { departmentId } = req.params;
      const institution = String(req.user?.college || "").trim();

      const courses = await Course.find({ departmentId })
        .find({ institution: institutionFilter(institution) })
        .sort({ semester: 1, courseCode: 1 })
        .select("_id semester scheme courseCode departmentId");

      res.json({
        success: true,
        courses,
      });
    } catch (err) {
      console.error("Error fetching courses:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

/**
 * GET /api/office/course-divisions/:courseId
 * Get divisions for a specific course
 * Auth: Office staff or admin
 */
router.get(
  "/course-divisions/:courseId",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const institution = String(req.user?.college || "").trim();

      const divisions = await Division.find({ courseId })
        .find({ institution: institutionFilter(institution) })
        .sort({ name: 1 })
        .select("_id name courseId departmentId");

      res.json({
        success: true,
        divisions,
      });
    } catch (err) {
      console.error("Error fetching divisions:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

/**
 * POST /api/office/export-credentials
 * Export student credentials as data (for office staff use)
 * Auth: Office staff or admin
 * Body: { division?: string, batch?: string }
 */
router.post(
  "/export-credentials",
  authenticate,
  authorizeOffice,
  async (req, res) => {
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
  },
);

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
      const student = await Student.findOne({ _id: req.params.studentId, institution: req.user.college });

      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Generate new password
      const newPassword = generateSafePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update student record
      await Student.updateMany(
        { username: student.username },
        {
          $set: {
            plainPassword: newPassword,
            passwordGeneratedAt: new Date(),
          },
        },
      );

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
  },
);

/**
 * POST /api/office/students/seat-numbers
 * Batch update seat numbers for multiple students
 * Auth: Office staff or admin
 * Body: { seatNumbers: { [studentId]: seatNo } }
 */
router.post(
  "/students/seat-numbers",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const { seatNumbers } = req.body;

      if (!seatNumbers || typeof seatNumbers !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid seat numbers payload" });
      }

      const bulkOps = Object.entries(seatNumbers).map(([studentId, seatNo]) => ({
        updateOne: {
          filter: { _id: studentId, institution: req.user.college },
          update: { $set: { seatNo: (seatNo || "").toString().trim() } },
        },
      }));

      if (bulkOps.length > 0) {
        await Student.bulkWrite(bulkOps);
      }

      res.json({ success: true, message: "Seat numbers updated successfully" });
    } catch (err) {
      console.error("Batch update seat numbers error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

/**
 * POST /api/office/students/bulk-seat-numbers
 * Bulk upload seat numbers by enrollment number
 * Auth: Office staff or admin
 * Body: {
 *   entries: [{ enrollmentNo, seatNo }],
 *   departmentId?: ObjectId,
 *   courseId?: ObjectId,
 *   divisionId?: ObjectId,
 *   academicYear?: string
 * }
 */
router.post(
  "/students/bulk-seat-numbers",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const { entries, departmentId, courseId, divisionId, academicYear } = req.body;

      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide a non-empty array of { enrollmentNo, seatNo } entries.",
        });
      }

      let updated = 0;
      let skipped = 0;
      const notFound = [];
      const errors = [];

      for (const entry of entries) {
        const enrollmentNo = (entry.enrollmentNo || "").toString().trim();
        const seatNo = (entry.seatNo || "").toString().trim();

        if (!enrollmentNo) {
          skipped++;
          errors.push({ enrollmentNo: "(empty)", error: "Missing enrollment number" });
          continue;
        }

        if (!seatNo) {
          skipped++;
          errors.push({ enrollmentNo, error: "Missing seat number" });
          continue;
        }

        // Build filter to find the student
        const filter = {
          institution: req.user.college,
          enrollmentNo: { $regex: new RegExp(`^${enrollmentNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        };

        // Apply optional scope filters
        if (departmentId) filter.departmentId = departmentId;
        if (courseId) filter.courseId = courseId;
        if (divisionId) filter.divisionId = divisionId;
        if (academicYear) filter.academicYear = (academicYear || "").toString().trim();

        const result = await Student.updateOne(filter, { $set: { seatNo } });

        if (result.matchedCount > 0) {
          updated++;
        } else {
          notFound.push({ enrollmentNo, seatNo, error: "Student not found with this enrollment number" });
        }
      }

      res.json({
        success: true,
        message: `Updated ${updated} seat numbers. ${skipped} skipped. ${notFound.length} not found.`,
        updated,
        skipped,
        notFound,
        errors,
      });
    } catch (err) {
      console.error("Bulk seat numbers upload error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

/**
 * GET /api/office/student/:id
 * Get specific student details (with auth)
 * Auth: Office staff or admin
 */
router.get("/student/:id", authenticate, authorizeOffice, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, institution: req.user.college });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
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
 * Body: {
 *   students: [{ rollNo, enrollmentNo, studentName }],
 *   batch: string,
 *   departmentId: ObjectId,
 *   courseId: ObjectId,
 *   divisionId: ObjectId
 * }
 */
router.post("/bulk-import", authenticate, authorizeOffice, async (req, res) => {
  try {
    const { students, batch, departmentId, courseId, divisionId, batchAllocations, academicYear } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid students array",
      });
    }

    // Validate that department, course, and division are provided
    if (!departmentId || !courseId || !divisionId) {
      return res.status(400).json({
        success: false,
        message: "Department, Course, and Division are required",
      });
    }

    const hasAllocations = Array.isArray(batchAllocations) && batchAllocations.length > 0;

    let normalizedAllocations = [];
    if (hasAllocations) {
      normalizedAllocations = batchAllocations.map((allocation) => ({
        batch: (allocation?.batch || "").toString().trim(),
        count: Number(allocation?.count || 0),
      }));

      const invalidAllocation = normalizedAllocations.find(
        (allocation) => !allocation.batch || !Number.isInteger(allocation.count) || allocation.count <= 0,
      );

      if (invalidAllocation) {
        return res.status(400).json({
          success: false,
          message: "Each batch allocation must include valid batch and positive integer count",
        });
      }

      const totalAllocated = normalizedAllocations.reduce(
        (sum, allocation) => sum + allocation.count,
        0,
      );

      if (totalAllocated !== students.length) {
        return res.status(400).json({
          success: false,
          message: `Batch allocation mismatch: allocated ${totalAllocated}, uploaded students ${students.length}`,
        });
      }
    } else if (!batch || !batch.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Batch is required when custom batch allocations are not provided",
      });
    }

    const expandedBatches = hasAllocations
      ? normalizedAllocations.flatMap((allocation) =>
          Array.from({ length: allocation.count }, () => allocation.batch),
        )
      : [];

    // Verify that the department, course, and division exist and are properly related
    const department = await Department.findOne({ _id: departmentId, institution: req.user.college });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found in your institution",
      });
    }

    const course = await Course.findById(courseId);
    if (!course || course.departmentId.toString() !== departmentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid course for the selected department",
      });
    }

    const division = await Division.findOne({ _id: divisionId, institution: req.user.college });
    if (!division || division.courseId.toString() !== courseId) {
      return res.status(400).json({
        success: false,
        message: "Invalid division for the selected course in your institution",
      });
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [],
      generatedCredentials: [],
    };

    for (const [index, studentData] of students.entries()) {
      const { rollNo, enrollmentNo, studentName } = studentData;
      const assignedBatch = hasAllocations
        ? expandedBatches[index]
        : batch.toString().trim();

      // Validate required fields
      if (!rollNo || !enrollmentNo || !studentName) {
        results.skipped++;
        results.errors.push({
          enrollmentNo,
          error:
            "Missing required fields (RollNo, EnrollmentNo, or StudentName)",
        });
        continue;
      }

      try {
        // Check if student already exists in this class (same department, course, and division)
        // (allows same student info in different classes)
        const existingStudent = await Student.findOne({
          institution: req.user.college,
          departmentId,
          courseId,
          divisionId,
          academicYear: (academicYear || "").toString().trim(),
          $or: [{ rollNo }, { enrollmentNo }],
        });

        if (existingStudent) {
          results.skipped++;
          results.errors.push({
            enrollmentNo,
            error: "Student already exists in this batch/course/division",
          });
          continue;
        }

        // Generate/reuse credentials (keep stable by username)
        const username = await generateUniqueUsername(enrollmentNo, req.user.college);
        const existingUser = await User.findOne({ username });
        let plainPassword = "";
        let hashedPassword = "";

        if (existingUser) {
          if (existingUser.role !== "student") {
            results.skipped++;
            results.errors.push({
              enrollmentNo,
              error: "Username already exists for a non-student account",
            });
            continue;
          }

          const existingCredentialStudent = await Student.findOne({
            institution: req.user.college,
            username,
            plainPassword: { $exists: true, $ne: "" },
          }).sort({ updatedAt: -1, createdAt: -1 });

          if (existingCredentialStudent?.plainPassword) {
            plainPassword = existingCredentialStudent.plainPassword;
          } else {
            plainPassword = generateSafePassword();
            hashedPassword = await bcrypt.hash(plainPassword, 10);
            existingUser.password = hashedPassword;
            existingUser.college = req.user.college;
            await existingUser.save();
          }
        } else {
          plainPassword = generateSafePassword();
          hashedPassword = await bcrypt.hash(plainPassword, 10);
        }

        // Create student record with department, course, and division references
        const newStudent = new Student({
          rollNo,
          enrollmentNo,
          studentName,
          batch: assignedBatch,
          academicYear: (academicYear || "").toString().trim(),
          division: division.name, // Store division name for backward compatibility
          departmentId,
          courseId,
          divisionId,
          institution: req.user.college,
          username,
          plainPassword,
          passwordGeneratedAt: new Date(),
        });

        await newStudent.save();

        // Ensure StudentAcademicHistory record is created
        try {
          await ensureStudentHistory(newStudent);
        } catch (historyErr) {
          console.error(`[Office Bulk Import] Error creating student history record for ${enrollmentNo}:`, historyErr);
        }

        // Create user account for student (if not existing)
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
    const {
      rollNo,
      enrollmentNo,
      studentName,
      batch,
      academicYear,
      division,
      aadhaarNo,
      departmentId,
      courseId,
      divisionId,
      seatNo,
    } = req.body;

    if (!studentName || !rollNo || !enrollmentNo || !batch) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const currentStudent = await Student.findOne({ _id: req.params.id, institution: req.user.college });
    if (!currentStudent) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const deptId = departmentId || currentStudent.departmentId;
    const crsId = courseId || currentStudent.courseId;
    const divId = divisionId || currentStudent.divisionId;

    const duplicate = await Student.findOne({
      _id: { $ne: req.params.id },
      institution: req.user.college,
      departmentId: deptId,
      courseId: crsId,
      divisionId: divId,
      academicYear: (academicYear || "").toString().trim(),
      $or: [{ rollNo }, { enrollmentNo }],
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Another student with this roll number or enrollment number already exists in this class",
      });
    }

    const updateData = {
      rollNo,
      enrollmentNo,
      studentName,
      batch,
      academicYear: (academicYear || "").toString().trim(),
      division: division || "",
      aadhaarNo: (aadhaarNo || "").toString().trim(),
      seatNo: (seatNo || "").toString().trim(),
    };

    // If new department/course/division IDs are provided, validate and update them
    if (departmentId && courseId && divisionId) {
      const department = await Department.findOne({ _id: departmentId, institution: req.user.college });
      const course = await Course.findById(courseId);
      const division = await Division.findOne({ _id: divisionId, institution: req.user.college });

      if (!department || !course || !division) {
        return res.status(404).json({
          success: false,
          message: "Invalid department, course, or division",
        });
      }

      if (
        course.departmentId.toString() !== departmentId ||
        division.courseId.toString() !== courseId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid relationship between department, course, and division",
        });
      }

      updateData.departmentId = departmentId;
      updateData.courseId = courseId;
      updateData.divisionId = divisionId;
      updateData.division = division.name;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    )
      .populate("departmentId", "name code")
      .populate("courseId", "semester scheme courseCode")
      .populate("divisionId", "name");

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Ensure StudentAcademicHistory record is updated
    try {
      await ensureStudentHistory(updatedStudent);
    } catch (historyErr) {
      console.error("[Office Student Edit] Error updating student history record:", historyErr);
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
router.delete(
  "/student/:id",
  authenticate,
  authorizeOffice,
  async (req, res) => {
    try {
      const student = await Student.findOne({ _id: req.params.id, institution: req.user.college });

      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Delete associated user account
      if (student.username) {
        await User.findOneAndDelete({ username: student.username });
      }

      await Student.deleteOne({ _id: req.params.id, institution: req.user.college });

      res.json({
        success: true,
        message: "Student deleted successfully",
        studentName: student.studentName,
      });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ============================================
// NOTICES MANAGEMENT & ANALYTICS (Office/Faculty)
// ============================================

const noticesUploadsDir = path.join(__dirname, "../uploads/notices");
if (!fs.existsSync(noticesUploadsDir)) {
  fs.mkdirSync(noticesUploadsDir, { recursive: true });
}

const noticeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, noticesUploadsDir);
  },
  filename: (_req, file, cb) => {
    const cleaned = String(file.originalname || "attachment")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${cleaned}`);
  },
});

const noticeUpload = multer({
  storage: noticeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF, Images, DOC, and Excel files are allowed."));
    }
  },
});

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    if (typeof value === "string") {
      return value.split(",").map(item => item.trim()).filter(Boolean);
    }
    return [value];
  }
};

const checkStudentTargeted = (notice, student) => {
  if (notice.targetType === "all" || notice.targetType === "all-students") {
    return true;
  }
  if (notice.targetType === "particular-student") {
    return (
      (notice.targetStudents || []).includes(student.username) ||
      (notice.targetStudents || []).includes(student.enrollmentNo)
    );
  }
  if (notice.targetType === "departments") {
    return (notice.targetDepartments || []).some(
      (deptId) => String(deptId) === String(student.departmentId)
    );
  }
  if (notice.targetType === "divisions") {
    return (notice.targetDivisions || []).some(
      (divId) => String(divId) === String(student.divisionId)
    );
  }
  if (notice.targetType === "academic-year") {
    return (notice.targetAcademicYears || []).includes(student.academicYear);
  }
  return false;
};

const checkFacultyTargeted = (notice, faculty) => {
  if (notice.targetType === "all" || notice.targetType === "all-faculty") {
    return true;
  }
  if (notice.targetType === "particular-faculty") {
    return (
      (notice.targetFaculties || []).includes(faculty.generatedUsername) ||
      (notice.targetFaculties || []).includes(faculty.email)
    );
  }
  if (notice.targetType === "departments") {
    return (notice.targetDepartments || []).some(
      (deptId) => String(deptId) === String(faculty.department)
    );
  }
  return false;
};

/**
 * GET /api/office/notices/analytics
 * Get statistics for the office notices dashboard
 */
router.get("/notices/analytics", authenticate, async (req, res) => {
  try {
    const college = req.user.college || "VP";
    const now = new Date();

    // 1. Total notices sent by office
    const totalNoticesSent = await Notice.countDocuments({ college, source: "office" });

    // 2. Today's notices
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayNotices = await Notice.countDocuments({
      college,
      source: "office",
      createdAt: { $gte: startOfToday }
    });

    // 3. Department-wise notices count
    const departments = await Department.find({ institution: college });
    const departmentWiseCount = {};
    for (const dept of departments) {
      const count = await Notice.countDocuments({
        college,
        $or: [
          { targetType: { $in: ["all", "all-students", "all-faculty"] } },
          { targetType: "departments", targetDepartments: dept._id }
        ]
      });
      departmentWiseCount[dept.name] = count;
    }

    // 4. Most active department (grouped by creator's department)
    const facultyNotices = await Notice.find({ college, source: "faculty" });
    const deptActivity = {};
    for (const notice of facultyNotices) {
      const facultyMember = await Faculty.findOne({ generatedUsername: notice.faculty });
      if (facultyMember && facultyMember.department) {
        const dept = await Department.findById(facultyMember.department);
        if (dept) {
          deptActivity[dept.name] = (deptActivity[dept.name] || 0) + 1;
        }
      }
    }
    let mostActiveDepartment = "N/A";
    let maxCount = 0;
    Object.entries(deptActivity).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDepartment = name;
      }
    });

    // 5. Pending unread notices (active notices unread by targeted students)
    const activeOfficeNotices = await Notice.find({
      college,
      source: "office",
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    });

    let pendingUnread = 0;
    for (const notice of activeOfficeNotices) {
      let targetedStudentsCount = 0;
      if (notice.targetType === "all" || notice.targetType === "all-students") {
        targetedStudentsCount = await Student.countDocuments({ institution: college });
      } else if (notice.targetType === "particular-student") {
        targetedStudentsCount = notice.targetStudents.length;
      } else if (notice.targetType === "departments") {
        targetedStudentsCount = await Student.countDocuments({
          institution: college,
          departmentId: { $in: notice.targetDepartments }
        });
      } else if (notice.targetType === "divisions") {
        targetedStudentsCount = await Student.countDocuments({
          institution: college,
          divisionId: { $in: notice.targetDivisions }
        });
      } else if (notice.targetType === "academic-year") {
        targetedStudentsCount = await Student.countDocuments({
          institution: college,
          academicYear: { $in: notice.targetAcademicYears }
        });
      }

      const readCount = notice.readBy.length;
      const unreadForThisNotice = Math.max(0, targetedStudentsCount - readCount);
      pendingUnread += unreadForThisNotice;
    }

    res.json({
      success: true,
      analytics: {
        totalNoticesSent,
        todayNotices,
        pendingUnread,
        mostActiveDepartment,
        departmentWiseCount
      }
    });
  } catch (error) {
    console.error("Error fetching notices analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/office/notices/target-options
 * Get lists of departments, divisions, and academic years for targeting
 */
router.get("/notices/target-options", authenticate, async (req, res) => {
  try {
    const college = req.user.college || "VP";

    const [departments, divisions] = await Promise.all([
      Department.find({ institution: college }).select("_id name code").sort({ name: 1 }),
      Division.find({ institution: college }).select("_id name").sort({ name: 1 })
    ]);

    const divisionNames = [...new Set(divisions.map(d => d.name))].sort();

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const academicYears = Array.from({ length: 8 }, (_, index) => {
      const year = startYear + index;
      return `${year}-${String(year + 1).slice(-2)}`;
    });

    res.json({
      success: true,
      departments,
      divisions,
      divisionNames,
      academicYears
    });
  } catch (error) {
    console.error("Error fetching notice target options:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/office/notices
 * Get notices
 */
router.get("/notices", authenticate, async (req, res) => {
  try {
    const college = req.user.college || "VP";
    const notices = await Notice.find({ college })
      .populate("targetDepartments", "name code")
      .populate("targetDivisions", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, notices });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/office/notices
 * Create a new notice with targeting options and attachments
 */
router.post("/notices", authenticate, noticeUpload.array("attachments", 10), async (req, res) => {
  try {
    const {
      title,
      content,
      noticeType,
      targetType,
      targetFaculties,
      targetStudents,
      targetDepartments,
      targetDivisions,
      targetAcademicYears,
      scheduledAt,
      expiresAt,
      division,
      faculty
    } = req.body;

    const college = req.user.college || "VP";

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }

    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    const notice = new Notice({
      title: title.trim(),
      content: content.trim(),
      faculty: faculty || req.user.username,
      source: "office",
      college,
      noticeType: noticeType || "general",
      targetType: targetType || "all",
      targetFaculties: parseJsonArray(targetFaculties),
      targetStudents: parseJsonArray(targetStudents),
      targetDepartments: parseJsonArray(targetDepartments),
      targetDivisions: parseJsonArray(targetDivisions),
      targetAcademicYears: parseJsonArray(targetAcademicYears),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      division: division || "",
      attachments
    });

    await notice.save();
    res.json({ success: true, message: "Notice created successfully", notice });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/office/notices/:id
 * Update a notice with targeting options and attachments
 */
router.put("/notices/:id", authenticate, noticeUpload.array("attachments", 10), async (req, res) => {
  try {
    const {
      title,
      content,
      noticeType,
      targetType,
      targetFaculties,
      targetStudents,
      targetDepartments,
      targetDivisions,
      targetAcademicYears,
      scheduledAt,
      expiresAt,
      division,
      existingAttachments
    } = req.body;

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    if (title) notice.title = title.trim();
    if (content) notice.content = content.trim();
    if (noticeType) notice.noticeType = noticeType;
    if (targetType) notice.targetType = targetType;
    
    notice.targetFaculties = parseJsonArray(targetFaculties);
    notice.targetStudents = parseJsonArray(targetStudents);
    notice.targetDepartments = parseJsonArray(targetDepartments);
    notice.targetDivisions = parseJsonArray(targetDivisions);
    notice.targetAcademicYears = parseJsonArray(targetAcademicYears);
    
    if (scheduledAt) notice.scheduledAt = new Date(scheduledAt);
    notice.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (division !== undefined) notice.division = division;

    const newAttachments = (req.files || []).map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    let remainingAttachments = [];
    if (existingAttachments) {
      remainingAttachments = parseJsonArray(existingAttachments);
    }

    // Clean up deleted files from disk
    const keptPaths = remainingAttachments.map(att => att.path);
    const deletedAttachments = notice.attachments.filter(att => !keptPaths.includes(att.path));
    for (const delAtt of deletedAttachments) {
      const fullPath = path.resolve(delAtt.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    notice.attachments = remainingAttachments.concat(newAttachments);
    notice.updatedAt = new Date();

    await notice.save();
    res.json({ success: true, message: "Notice updated successfully", notice });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/office/notices/:id
 * Delete a notice and its file attachments
 */
router.delete("/notices/:id", authenticate, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    // Delete attached files from disk
    for (const att of notice.attachments || []) {
      const fullPath = path.resolve(att.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/office/notices/file/:noticeId/:attachmentIndex
 * Securely serve attachments to targeted users
 */
router.get("/notices/file/:noticeId/:attachmentIndex", authenticate, async (req, res) => {
  try {
    const { noticeId, attachmentIndex } = req.params;
    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    const userRole = req.user.role;
    const userCollege = req.user.college.toUpperCase();

    if (notice.college.toUpperCase() !== userCollege) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (userRole === "student") {
      const student = await Student.findOne({ username: req.user.username });
      if (!student) {
        return res.status(404).json({ success: false, message: "Student record not found" });
      }
      if (!checkStudentTargeted(notice, student)) {
        return res.status(403).json({ success: false, message: "Access denied. You are not targeted by this notice." });
      }
    } else if (userRole === "faculty") {
      const faculty = await Faculty.findOne({ generatedUsername: req.user.username });
      if (!faculty) {
        return res.status(404).json({ success: false, message: "Faculty record not found" });
      }
      if (!checkFacultyTargeted(notice, faculty)) {
        return res.status(403).json({ success: false, message: "Access denied. You are not targeted by this notice." });
      }
    }

    const attachment = notice.attachments[attachmentIndex];
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    const absolutePath = path.resolve(attachment.path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: "Stored file missing" });
    }

    res.setHeader("Content-Type", attachment.mimetype || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(attachment.filename || "attachment")}"`
    );
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("Error serving notice file:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

