const express = require("express");
const router = express.Router();
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

/**
 * GET /api/faculty/notices
 * Get notices for faculty
 */
router.get("/notices", authenticate, async (req, res) => {
  try {
    const { faculty } = req.query;
    const college = req.user.college || localStorage?.getItem("college") || "VP";

    let query = { college };
    if (faculty) {
      query.faculty = faculty;
    }

    const notices = await Notice.find(query).sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/faculty/notices
 * Create a new notice
 */
router.post("/notices", authenticate, async (req, res) => {
  try {
    const { title, content, division, faculty } = req.body;
    const college = req.user.college || "VP";

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }

    const notice = new Notice({
      title,
      content,
      division,
      faculty: faculty || req.user.username,
      source: "office",
      college,
    });

    await notice.save();
    res.json({ success: true, message: "Notice created successfully", notice });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/faculty/notices/:id
 * Update a notice
 */
router.put("/notices/:id", authenticate, async (req, res) => {
  try {
    const { title, content, division } = req.body;

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        division,
        source: "office",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    res.json({ success: true, message: "Notice updated successfully", notice });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/faculty/notices/:id
 * Delete a notice
 */
router.delete("/notices/:id", authenticate, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    res.json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
