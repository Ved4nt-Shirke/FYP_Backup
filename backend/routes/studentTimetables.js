const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Department = require("../models/Department");
const StudentTimetable = require("../models/StudentTimetable");

const router = express.Router();

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactRegex = (value = "") => new RegExp(`^${escapeRegex(String(value || "").trim())}$`, "i");

const uploadsDir = path.join(__dirname, "../uploads/student-timetables");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeOriginal = String(file.originalname || "timetable")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-80);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF and image files (PNG/JPG/WEBP) are allowed"));
  },
});

const findStudentFromRequest = async (user) => {
  const normalized = normalizeText(user.username || "");

  let student = await Student.findOne({
    username: { $regex: exactRegex(normalized) },
  });

  if (!student && user.enrollmentNo) {
    student = await Student.findOne({ enrollmentNo: user.enrollmentNo });
  }

  if (!student && normalized) {
    student = await Student.findOne({ enrollmentNo: normalized });
  }

  return student;
};

const ensureFaculty = (req, res, next) => {
  if (!req.user || !["faculty", "hod", "academic_coordinator"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Access denied. Faculty only." });
  }
  next();
};

const ensureStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied. Students only." });
  }
  next();
};

const isVisibleForStudents = (timetable) => {
  if (!timetable || !timetable.isActive) {
    return false;
  }
  const endDate = new Date(timetable.semesterEndDate);
  return Number.isFinite(endDate.getTime()) && Date.now() >= endDate.getTime();
};

router.use(authenticate);

router.post("/faculty", ensureFaculty, upload.single("timetableFile"), async (req, res) => {
  try {
    const {
      title,
      year,
      departmentId,
      courseId,
      divisionId,
      semesterEndDate,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Timetable file is required" });
    }

    if (!year || !departmentId || !courseId || !divisionId || !semesterEndDate) {
      return res.status(400).json({
        success: false,
        message: "Year, department, course, division and semester end date are required",
      });
    }

    const institution = String(req.user.college || "").toUpperCase();
    const [department, course, division] = await Promise.all([
      Department.findOne({ _id: departmentId, institution }),
      Course.findOne({ _id: courseId, institution }),
      Division.findOne({ _id: divisionId, institution }),
    ]);

    if (!department || !course || !division) {
      return res.status(404).json({
        success: false,
        message: "Selected department/course/division is invalid for your institution",
      });
    }

    await StudentTimetable.updateMany(
      {
        institution,
        departmentId,
        courseId,
        divisionId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          removedAt: new Date(),
        },
      },
    );

    const timetable = await StudentTimetable.create({
      institution,
      title: title?.trim() || "Class Timetable",
      year: String(year).trim(),
      departmentId,
      courseId,
      divisionId,
      divisionName: division.name,
      semesterEndDate: new Date(semesterEndDate),
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Timetable uploaded successfully",
      timetable,
    });
  } catch (error) {
    console.error("Error uploading student timetable:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/faculty", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const { divisionId, activeOnly } = req.query;

    const filters = { institution };
    if (divisionId) {
      filters.divisionId = divisionId;
    }
    if (String(activeOnly).toLowerCase() === "true") {
      filters.isActive = true;
    }

    const timetables = await StudentTimetable.find(filters)
      .populate("departmentId", "name code")
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, timetables });
  } catch (error) {
    console.error("Error fetching faculty timetables:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/faculty/:id", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const timetable = await StudentTimetable.findOne({ _id: req.params.id, institution });

    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }

    timetable.isActive = false;
    timetable.removedAt = new Date();
    await timetable.save();

    return res.json({ success: true, message: "Timetable removed successfully" });
  } catch (error) {
    console.error("Error removing timetable:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/student/current", ensureStudent, async (req, res) => {
  try {
    const student = await findStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({
        success: false,
        visible: false,
        message: "Student record not found",
      });
    }

    const institution = String(req.user.college || "").toUpperCase();
    const divisionQuery = [];

    if (student.divisionId) {
      divisionQuery.push({ divisionId: student.divisionId });
    }

    const studentDivision = String(student.division || "").trim();
    if (studentDivision) {
      divisionQuery.push({ divisionName: { $regex: exactRegex(studentDivision) } });
    }

    if (divisionQuery.length === 0) {
      return res.status(200).json({
        success: true,
        visible: false,
        message: "No division is mapped to your account",
      });
    }

    const timetable = await StudentTimetable.findOne({
      institution,
      isActive: true,
      $or: divisionQuery,
    })
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name")
      .sort({ createdAt: -1 });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        visible: false,
        message: "No timetable is published for your division",
      });
    }

    if (!isVisibleForStudents(timetable)) {
      return res.status(200).json({
        success: true,
        visible: false,
        message: "Timetable will be available after semester end",
        availableFrom: timetable.semesterEndDate,
      });
    }

    return res.json({
      success: true,
      visible: true,
      timetable,
    });
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const timetable = await StudentTimetable.findOne({
      _id: req.params.id,
      institution,
    });

    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable file not found" });
    }

    if (req.user.role === "student") {
      if (!isVisibleForStudents(timetable)) {
        return res.status(403).json({ success: false, message: "Timetable is not available yet" });
      }

      const student = await findStudentFromRequest(req.user);
      if (!student) {
        return res.status(404).json({ success: false, message: "Student record not found" });
      }

      const sameDivisionById =
        student.divisionId && String(student.divisionId) === String(timetable.divisionId);
      const sameDivisionByName =
        !sameDivisionById &&
        String(student.division || "").trim() &&
        exactRegex(student.division).test(String(timetable.divisionName || ""));

      if (!sameDivisionById && !sameDivisionByName) {
        return res.status(403).json({ success: false, message: "Unauthorized access to timetable" });
      }
    } else if (!["faculty", "hod", "academic_coordinator", "admin", "office"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    const absoluteFilePath = path.resolve(timetable.filePath);
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ success: false, message: "Stored timetable file is missing" });
    }

    res.setHeader("Content-Type", timetable.fileMimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(timetable.fileName)}"`);
    return res.sendFile(absoluteFilePath);
  } catch (error) {
    console.error("Error serving timetable file:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
