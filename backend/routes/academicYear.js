const express = require("express");
const router = express.Router();
const AcademicYear = require("../models/AcademicYear");
const Ciaan = require("../models/Ciann");
const Faculty = require("../models/Faculty");
const User = require("../models/user");
const Notification = require("../models/Notification");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// ──────────────────────────────────────────────
// GET /api/academic-year/current
// Returns the currently active academic year for the user's institution.
// Available to ALL authenticated users (faculty, admin, etc.)
// ──────────────────────────────────────────────
router.get("/current", async (req, res) => {
  try {
    const college = req.user.college;
    if (!college || college === "ALL") {
      // Superadmin – return null or first active
      const activeYear = await AcademicYear.findOne({ status: "active" }).sort({ createdAt: -1 });
      return res.json({ success: true, academicYear: activeYear || null });
    }

    const activeYear = await AcademicYear.findOne({
      college,
      status: "active",
    });

    return res.json({ success: true, academicYear: activeYear || null });
  } catch (err) {
    console.error("Error fetching current academic year:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/academic-year/all
// Returns all academic years for the user's institution.
// Available to ALL authenticated users.
// ──────────────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const college = req.user.college;
    let filter = {};

    if (college && college !== "ALL") {
      filter.college = college;
    }

    const years = await AcademicYear.find(filter)
      .populate("createdBy", "username role")
      .sort({ createdAt: -1 });

    return res.json({ success: true, academicYears: years });
  } catch (err) {
    console.error("Error fetching academic years:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/academic-year/create
// Create a new academic year. Auto-deactivates the previous active year.
// Admin only.
// ──────────────────────────────────────────────
router.post("/create", authorizeAdmin, async (req, res) => {
  try {
    const { yearName, scheme, startDate, endDate } = req.body;
    const college = req.user.college;

    if (!yearName || !scheme || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: yearName, scheme, startDate, endDate",
      });
    }

    if (!college || college === "ALL") {
      return res.status(400).json({
        success: false,
        message: "Superadmin must specify a college context to create academic years",
      });
    }

    // Check for duplicate year name in the same institution
    const existing = await AcademicYear.findOne({ college, yearName: yearName.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Academic year "${yearName}" already exists for this institution`,
      });
    }

    // Deactivate any currently active academic year for this institution
    await AcademicYear.updateMany(
      { college, status: "active" },
      { $set: { status: "completed" } }
    );

    // Create the new academic year as active
    const newYear = await AcademicYear.create({
      yearName: yearName.trim(),
      scheme: scheme.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "active",
      college,
      createdBy: req.user._id,
    });

    // Send notifications to all faculty in this institution
    try {
      const facultyUsers = await User.find({
        college,
        role: { $in: ["faculty", "hod", "academic_coordinator"] },
      }).select("_id");

      const notifications = facultyUsers.map((user) => ({
        recipient: user._id,
        sender: req.user._id,
        type: "academic_year_activated",
        message: `New Academic Year ${newYear.yearName} activated. Scheme: ${newYear.scheme}`,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Failed to send academic year notifications:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Academic Year ${newYear.yearName} created and activated`,
      academicYear: newYear,
    });
  } catch (err) {
    console.error("Error creating academic year:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This academic year already exists for your institution",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/academic-year/complete/:id
// Mark an academic year as completed/archived.
// Admin only.
// ──────────────────────────────────────────────
router.put("/complete/:id", authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    if (college && college !== "ALL" && year.college !== college) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (year.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This academic year is already completed",
      });
    }

    year.status = "completed";
    await year.save();

    // Notify faculty
    try {
      const facultyUsers = await User.find({
        college: year.college,
        role: { $in: ["faculty", "hod", "academic_coordinator"] },
      }).select("_id");

      const notifications = facultyUsers.map((user) => ({
        recipient: user._id,
        sender: req.user._id,
        type: "academic_year_completed",
        message: `Academic Year ${year.yearName} has been completed/archived. Ciaan editing for this year is now read-only.`,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Failed to send completion notifications:", notifErr.message);
    }

    return res.json({
      success: true,
      message: `Academic Year ${year.yearName} marked as completed`,
      academicYear: year,
    });
  } catch (err) {
    console.error("Error completing academic year:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/academic-year/activate/:id
// Re-activate a completed academic year (deactivates current active).
// Admin only.
// ──────────────────────────────────────────────
router.put("/activate/:id", authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    if (college && college !== "ALL" && year.college !== college) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (year.status === "active") {
      return res.status(400).json({
        success: false,
        message: "This academic year is already active",
      });
    }

    // Deactivate any currently active year
    await AcademicYear.updateMany(
      { college: year.college, status: "active" },
      { $set: { status: "completed" } }
    );

    // Activate this year
    year.status = "active";
    await year.save();

    // Notify faculty
    try {
      const facultyUsers = await User.find({
        college: year.college,
        role: { $in: ["faculty", "hod", "academic_coordinator"] },
      }).select("_id");

      const notifications = facultyUsers.map((user) => ({
        recipient: user._id,
        sender: req.user._id,
        type: "academic_year_activated",
        message: `Academic Year ${year.yearName} has been re-activated. Scheme: ${year.scheme}`,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Failed to send activation notifications:", notifErr.message);
    }

    return res.json({
      success: true,
      message: `Academic Year ${year.yearName} re-activated`,
      academicYear: year,
    });
  } catch (err) {
    console.error("Error activating academic year:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/academic-year/:id/stats
// Get Ciaan tracking stats for a specific academic year.
// Admin only.
// ──────────────────────────────────────────────
router.get("/:id/stats", authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    if (college && college !== "ALL" && year.college !== college) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get all Ciaans for this academic year (matching by yearName string)
    const Ciaans = await Ciaan.find({
      college: year.college,
      academicYear: year.yearName,
    }).populate("faculty", "fullName department");

    const totalCiaans = Ciaans.length;
    const completedCiaans = Ciaans.filter((c) => c.status === "completed").length;
    const activeCiaans = Ciaans.filter((c) => c.status === "active").length;
    const archivedCiaans = Ciaans.filter((c) => c.status === "archived").length;

    // Faculty-wise stats
    const facultyMap = {};
    Ciaans.forEach((Ciaan) => {
      const ownerKey = Ciaan.ownerUsername || Ciaan.owner?.toString() || "Unknown";
      if (!facultyMap[ownerKey]) {
        facultyMap[ownerKey] = {
          facultyName: ownerKey,
          total: 0,
          completed: 0,
          active: 0,
          archived: 0,
        };
      }
      facultyMap[ownerKey].total += 1;
      if (Ciaan.status === "completed") facultyMap[ownerKey].completed += 1;
      else if (Ciaan.status === "active") facultyMap[ownerKey].active += 1;
      else if (Ciaan.status === "archived") facultyMap[ownerKey].archived += 1;
    });

    const facultyStats = Object.values(facultyMap).sort((a, b) => b.total - a.total);

    // Department-wise stats
    const deptMap = {};
    Ciaans.forEach((Ciaan) => {
      const deptName = Ciaan.department?.name || "Unknown";
      if (!deptMap[deptName]) {
        deptMap[deptName] = { department: deptName, total: 0, completed: 0, pending: 0 };
      }
      deptMap[deptName].total += 1;
      if (Ciaan.status === "completed") deptMap[deptName].completed += 1;
      else deptMap[deptName].pending += 1;
    });

    const departmentStats = Object.values(deptMap).sort((a, b) => b.total - a.total);

    // Subject-wise stats
    const subjectMap = {};
    Ciaans.forEach((Ciaan) => {
      const subjectName = Ciaan.subject?.name || "Unknown";
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = { subject: subjectName, total: 0, completed: 0, pending: 0 };
      }
      subjectMap[subjectName].total += 1;
      if (Ciaan.status === "completed") subjectMap[subjectName].completed += 1;
      else subjectMap[subjectName].pending += 1;
    });

    const subjectStats = Object.values(subjectMap).sort((a, b) => b.total - a.total);

    // Semester-wise stats
    const semesterMap = {};
    Ciaans.forEach((Ciaan) => {
      const sem = Ciaan.semester || "Unknown";
      if (!semesterMap[sem]) {
        semesterMap[sem] = { semester: sem, total: 0, completed: 0, pending: 0 };
      }
      semesterMap[sem].total += 1;
      if (Ciaan.status === "completed") semesterMap[sem].completed += 1;
      else semesterMap[sem].pending += 1;
    });

    const semesterStats = Object.values(semesterMap).sort((a, b) =>
      parseInt(a.semester) - parseInt(b.semester)
    );

    return res.json({
      success: true,
      yearName: year.yearName,
      scheme: year.scheme,
      status: year.status,
      stats: {
        totalCiaans,
        completedCiaans,
        activeCiaans,
        archivedCiaans,
        completionPercentage: totalCiaans > 0 ? Math.round((completedCiaans / totalCiaans) * 100) : 0,
        facultyStats,
        departmentStats,
        subjectStats,
        semesterStats,
      },
    });
  } catch (err) {
    console.error("Error fetching academic year stats:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/academic-year/:id
// Permanently delete an academic year.
// Admin only. Cannot delete an active academic year.
// ──────────────────────────────────────────────
router.delete("/:id", authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    if (college && college !== "ALL" && year.college !== college) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (year.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an active academic year. Please archive it first before deleting.",
      });
    }

    await AcademicYear.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Academic Year "${year.yearName}" has been permanently deleted.`,
    });
  } catch (err) {
    console.error("Error deleting academic year:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

