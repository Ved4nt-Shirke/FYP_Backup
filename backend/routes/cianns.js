const express = require("express");
const router = express.Router();
const Ciann = require("../models/Ciann");
const Faculty = require("../models/Faculty");
const { authenticate } = require("../middleware/auth");

// All CIANN routes require authentication to scope data per faculty
router.use(authenticate);

// Helper: generate a unique 4-digit ciannId
async function generateUniqueCiannId() {
  let unique = false;
  let ciannId;
  while (!unique) {
    ciannId = Math.floor(1000 + Math.random() * 9000);
    const exists = await Ciann.findOne({ ciannId });
    if (!exists) unique = true;
  }
  return ciannId;
}

// Helper: build base filters based on user role
function buildScopedFilter(user) {
  if (!user) return {};

  if (user.role === "faculty" || user.role === "office") {
    return { owner: user._id };
  }

  if (user.role === "admin") {
    return {
      $or: [{ college: user.college }, { college: { $exists: false } }],
    };
  }

  // superadmin gets everything
  return {};
}

// Helper: ensure the current user can access the CIANN
function ensureAccess(ciann, user) {
  if (!ciann || !user) return false;

  if (user.role === "superadmin") return true;

  if (user.role === "admin") {
    return !ciann.college || ciann.college === user.college;
  }

  // Faculty and office staff can only access their own CIANNs
  return ciann.owner?.toString() === user._id.toString();
}

// Create CIANN
router.post("/", async (req, res) => {
  try {
    const ciannId = await generateUniqueCiannId();

    // Link to faculty document if available (by email/username match)
    let facultyRef = null;
    if (req.user?.username) {
      facultyRef = await Faculty.findOne({
        generatedUsername: req.user.username,
      });
    }

    const payload = {
      ...req.body,
      ciannId,
      owner: req.user._id,
      ownerUsername: req.user.username,
      ownerRole: req.user.role,
      college: req.user.college,
      faculty: facultyRef?._id || undefined,
    };

    const saved = await Ciann.create(payload);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all CIANNs (scoped per role)
router.get("/", async (req, res) => {
  try {
    const filter = buildScopedFilter(req.user);
    let cianns = await Ciann.find(filter).sort({ createdAt: -1 });

    // Populate courseCode from Course reference
    const Course = require("../models/Course");
    cianns = await Promise.all(
      cianns.map(async (ciann) => {
        const ciannObj = ciann.toObject();
        if (!ciannObj.courseCode) {
          try {
            let course = null;

            // Try to find by courseId first (for new CIANNs)
            if (ciannObj.courseId) {
              course = await Course.findById(ciannObj.courseId).select(
                "courseCode",
              );
            }

            // If not found, try to find by semester and department (for old CIANNs)
            if (!course && ciannObj.semester && ciannObj.department) {
              const deptId = ciannObj.department._id || ciannObj.department;
              course = await Course.findOne({
                semester: parseInt(ciannObj.semester),
                departmentId: deptId,
              }).select("courseCode _id");

              // Store the courseId for future use
              if (course) {
                ciannObj.courseId = course._id;
              }
            }

            if (course) {
              ciannObj.courseCode = course.courseCode;
              console.log(
                `✓ CIANN ${ciannObj.ciannId}: Found courseCode ${course.courseCode}`,
              );
            } else {
              console.log(`✗ CIANN ${ciannObj.ciannId}: Could not find course`);
            }
          } catch (err) {
            console.error(
              `Error fetching course for CIANN ${ciannObj.ciannId}:`,
              err.message,
            );
          }
        }
        return ciannObj;
      }),
    );

    res.status(200).json(cianns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get CIANN by ID
router.get("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    let ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Populate courseCode if it doesn't exist
    const ciannObj = ciann.toObject();
    if (!ciannObj.courseCode) {
      try {
        const Course = require("../models/Course");
        let course = null;

        // Try to find by courseId first
        if (ciannObj.courseId) {
          course = await Course.findById(ciannObj.courseId).select(
            "courseCode",
          );
        }

        // If not found, try by semester and department
        if (!course && ciannObj.semester && ciannObj.department) {
          const deptId = ciannObj.department._id || ciannObj.department;
          course = await Course.findOne({
            semester: parseInt(ciannObj.semester),
            departmentId: deptId,
          }).select("courseCode _id");

          if (course) {
            ciannObj.courseId = course._id;
          }
        }

        if (course) {
          ciannObj.courseCode = course.courseCode;
        }
      } catch (err) {
        console.error(
          `Could not find course for CIANN ${ciannObj.ciannId}:`,
          err.message,
        );
      }
    }

    res.status(200).json(ciannObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update CIANN
router.put("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const existing = await Ciann.findOne({ ciannId: numericCiannId });
    if (!existing) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(existing, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const safeBody = { ...req.body, updatedAt: new Date() };
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.ciannId;
    delete safeBody.faculty;

    const updatedCiann = await Ciann.findOneAndUpdate(
      { ciannId: numericCiannId },
      safeBody,
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCiann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete CIANN with password authentication and cascade delete all related data
router.delete("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const { password } = req.body;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const existing = await Ciann.findOne({ ciannId: numericCiannId });
    if (!existing) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(existing, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify password only if user is faculty
    if (req.user.role === "faculty") {
      if (!password) {
        return res.status(400).json({
          message: "Password is required to delete CIANN",
          requiresPassword: true,
        });
      }

      // Get faculty details and verify password
      const Faculty = require("../models/Faculty");
      const User = require("../models/user");
      const bcryptjs = require("bcryptjs");

      const user = await User.findById(req.user._id);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcryptjs.compare(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password. CIANN not deleted.",
          success: false,
        });
      }
    }

    // Delete all related data for this CIANN
    console.log(`🗑️ Deleting CIANN ${ciannId} and all related data...`);

    // Import models for cascade delete
    const Assessment = require("../models/Assessment");
    const CTMarks = require("../models/CTMarks");
    const StudentResult = require("../models/StudentResult");
    const TheoryAttendance = require("../models/TheoryAttendance");
    const PracticalAttendance = require("../models/PracticalAttendance");
    const TutorialAttendance = require("../models/TutorialAttendance");
    const ExtraAttendance = require("../models/ExtraAttendance");
    const ExtraPract = require("../models/ExtraPract");
    const PracticalExam = require("../models/PracticalExam");
    const PTMicroProject = require("../models/PTMicroProject");
    const AuditLog = require("../models/AuditLog");

    // Step 1: Delete all assessments related to this CIANN
    await Assessment.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted assessments");

    // Step 2: Delete all CT marks related to this CIANN
    await CTMarks.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted CT marks");

    // Step 3: Delete all student results related to this CIANN
    await StudentResult.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted student results");

    // Step 4: Delete all theory attendance records for this CIANN
    await TheoryAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted theory attendance");

    // Step 5: Delete all practical attendance records for this CIANN
    await PracticalAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted practical attendance");

    // Step 6: Delete all tutorial attendance records for this CIANN
    await TutorialAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted tutorial attendance");

    // Step 7: Delete all extra attendance records for this CIANN
    await ExtraAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted extra attendance");

    // Step 8: Delete all PT microproject marks for this CIANN
    await PTMicroProject.deleteMany({ ciannId: existing.ciannId });
    console.log("   ✓ Deleted PT microproject marks");

    // Step 8: Delete all extra practical records for this CIANN
    await ExtraPract.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted extra practical");

    // Step 9: Delete all practical exams for this CIANN
    await PracticalExam.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted practical exams");

    // Step 10: Delete audit logs related to this CIANN
    await AuditLog.deleteMany({
      resourceId: existing._id,
      resourceType: "Ciann",
    });
    console.log("   ✓ Deleted audit logs");

    // Step 11: Finally delete the CIANN record itself
    await Ciann.deleteOne({ _id: existing._id });
    console.log("   ✓ Deleted CIANN record");

    res.status(200).json({
      message: "CIANN and all related data deleted successfully",
      deletedCiann: existing,
      success: true,
    });
  } catch (err) {
    console.error("Error deleting CIANN:", err);
    res.status(500).json({
      message: "Failed to delete CIANN",
      error: err.message,
    });
  }
});

module.exports = router;
