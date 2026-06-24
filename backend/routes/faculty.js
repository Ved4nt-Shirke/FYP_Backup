const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const Notice = require("../models/Notice");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Department = require("../models/Department");
const Division = require("../models/Division");
const { resolveStudents } = require("../utils/studentHistoryHelper");

// Middleware to authenticate all notice routes
router.use(authenticate);

// ============================================
// NOTICES ATTACHMENT UPLOAD SETUP
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

// Get lists of departments, divisions, and academic years for targeting
router.get("/notices/target-options", async (req, res) => {
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

// Search students for notice targeting
router.get("/students", async (req, res) => {
  try {
    const students = await resolveStudents(req.query, req.user.college);
    res.json({ success: true, students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all notices for a faculty
router.get("/notices", async (req, res) => {
  try {
    const { faculty } = req.query;
    const college = req.user.college;

    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: "Faculty parameter is required",
      });
    }

    const notices = await Notice.find({ faculty, college })
      .populate("targetDepartments", "name code")
      .populate("targetDivisions", "name")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notices",
      error: error.message,
    });
  }
});

// Create a new notice
router.post("/notices", noticeUpload.array("attachments", 10), async (req, res) => {
  try {
    const {
      title,
      content,
      faculty,
      noticeType,
      targetType,
      targetFaculties,
      targetStudents,
      targetDepartments,
      targetDivisions,
      targetAcademicYears,
      scheduledAt,
      expiresAt,
      division
    } = req.body;
    const college = req.user.college;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    const newNotice = new Notice({
      title: title.trim(),
      content: content.trim(),
      faculty: faculty || req.user.username,
      source: "faculty",
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

    await newNotice.save();

    res.json({
      success: true,
      notice: newNotice,
      message: "Notice created successfully",
    });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notice",
      error: error.message,
    });
  }
});

// Update a notice
router.put("/notices/:id", noticeUpload.array("attachments", 10), async (req, res) => {
  try {
    const { id } = req.params;
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
    const college = req.user.college;

    const notice = await Notice.findOne({ _id: id, college });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
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
    if (!notice.source) notice.source = "faculty";
    notice.updatedAt = new Date();

    await notice.save();

    res.json({
      success: true,
      notice,
      message: "Notice updated successfully",
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notice",
      error: error.message,
    });
  }
});

// Delete a notice
router.delete("/notices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const notice = await Notice.findOne({ _id: id, college });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    // Delete attached files from disk
    for (const att of notice.attachments || []) {
      const fullPath = path.resolve(att.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Notice.deleteOne({ _id: id, college });

    res.json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notice",
      error: error.message,
    });
  }
});

// Get directory of active faculty members in same institution
router.get("/directory", async (req, res) => {
  try {
    const college = (req.user.college || "").trim();
    const { search, department } = req.query;

    let query = { 
      institution: { $regex: new RegExp("^" + college + "$", "i") }, 
      status: "active" 
    };

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { generatedUsername: { $regex: search, $options: "i" } }
      ];
    }

    // Don't show current user in search results to avoid sharing with self
    query.generatedUsername = { $ne: req.user.username };

    const facultyList = await Faculty.find(query)
      .populate("department", "name code")
      .select("fullName email employeeId generatedUsername department")
      .sort({ fullName: 1 })
      .limit(50);

    res.json({ success: true, faculty: facultyList });
  } catch (error) {
    console.error("Error fetching faculty directory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
