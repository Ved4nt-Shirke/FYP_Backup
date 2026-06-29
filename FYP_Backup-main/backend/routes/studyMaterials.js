const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const StudyMaterial = require("../models/StudyMaterial");
const Student = require("../models/Student");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Division = require("../models/Division");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../uploads/study-materials");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactRegex = (value = "") => new RegExp(`^${escapeRegex(String(value || "").trim())}$`, "i");

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const cleaned = String(file.originalname || "resource")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${cleaned}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "video/mp4",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Unsupported file type"));
  },
});

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

const formatBytes = (value = 0) => {
  const bytes = Number(value || 0);
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

router.use(authenticate);

router.post("/faculty", ensureFaculty, upload.single("resourceFile"), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      category,
      resourceType,
      externalUrl,
      departmentId,
      courseId,
      divisionId,
    } = req.body;

    if (!title || !category || !resourceType || !departmentId || !courseId || !divisionId) {
      return res.status(400).json({
        success: false,
        message: "Title, category, resource type, department, course and division are required",
      });
    }

    if (!["file", "link"].includes(String(resourceType))) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type",
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
        message: "Invalid department/course/division for your institution",
      });
    }

    if (String(resourceType) === "file" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file for file resource type",
      });
    }

    if (String(resourceType) === "link" && !String(externalUrl || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid external URL for link resource type",
      });
    }

    const material = await StudyMaterial.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      subject: String(subject || "General").trim(),
      category,
      resourceType,
      externalUrl: String(resourceType) === "link" ? String(externalUrl || "").trim() : "",
      fileName: req.file?.originalname || "",
      filePath: req.file?.path || "",
      fileMimeType: req.file?.mimetype || "",
      fileSize: req.file?.size || 0,
      departmentId,
      courseId,
      divisionId,
      divisionName: division.name,
      institution,
      uploadedBy: req.user._id,
      uploadedByName: req.user.username || "faculty",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Study material published successfully",
      material,
    });
  } catch (error) {
    console.error("Error publishing study material:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/faculty", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const { divisionId, courseId, activeOnly } = req.query;

    const query = { institution };
    if (divisionId) query.divisionId = divisionId;
    if (courseId) query.courseId = courseId;
    if (String(activeOnly).toLowerCase() === "true") query.isActive = true;

    const materials = await StudyMaterial.find(query)
      .populate("departmentId", "name code")
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, materials });
  } catch (error) {
    console.error("Error fetching faculty study materials:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/faculty/:id", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();

    const material = await StudyMaterial.findOne({ _id: req.params.id, institution });
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }

    material.isActive = false;
    await material.save();

    return res.json({ success: true, message: "Study material removed successfully" });
  } catch (error) {
    console.error("Error removing study material:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/student/current", ensureStudent, async (req, res) => {
  try {
    const student = await findStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const institution = String(req.user.college || "").toUpperCase();
    let divisionId = student.divisionId || null;

    if (!divisionId && student.division) {
      const mappedDivision = await Division.findOne({
        institution,
        name: { $regex: exactRegex(student.division) },
      }).select("_id");

      if (mappedDivision) {
        divisionId = mappedDivision._id;
      }
    }

    const query = {
      institution,
      isActive: true,
    };

    if (student.courseId) {
      query.courseId = student.courseId;
    }

    if (divisionId) {
      query.divisionId = divisionId;
    } else if (student.division) {
      query.divisionName = { $regex: exactRegex(student.division) };
    }

    const materials = await StudyMaterial.find(query)
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name")
      .sort({ createdAt: -1 });

    const normalized = materials.map((item) => ({
      _id: item._id,
      title: item.title,
      subject: item.subject || "General",
      type: item.category,
      category: item.category,
      resourceType: item.resourceType,
      size: item.resourceType === "file" ? formatBytes(item.fileSize) : "Link",
      fileSize: item.fileSize,
      date: item.createdAt,
      description: item.description,
      division: item.divisionId?.name || item.divisionName,
      course: item.courseId?.courseCode || "",
      externalUrl: item.externalUrl || "",
      downloadUrl: item.resourceType === "file" ? `/api/study-materials/file/${item._id}` : item.externalUrl,
    }));

    return res.json({
      success: true,
      materials: normalized,
    });
  } catch (error) {
    console.error("Error fetching student study materials:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      institution,
      isActive: true,
    });

    if (!material || material.resourceType !== "file") {
      return res.status(404).json({ success: false, message: "File resource not found" });
    }

    if (!["student", "faculty", "admin", "office", "hod", "academic_coordinator"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    if (req.user.role === "student") {
      const student = await findStudentFromRequest(req.user);
      if (!student) {
        return res.status(404).json({ success: false, message: "Student record not found" });
      }

      const sameDivisionById =
        student.divisionId && String(student.divisionId) === String(material.divisionId);
      const sameDivisionByName =
        !sameDivisionById &&
        String(student.division || "").trim() &&
        exactRegex(student.division).test(String(material.divisionName || ""));

      const sameCourse =
        !student.courseId || String(student.courseId) === String(material.courseId);

      if ((!sameDivisionById && !sameDivisionByName) || !sameCourse) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
    }

    const absolutePath = path.resolve(material.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: "Stored file missing" });
    }

    res.setHeader("Content-Type", material.fileMimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(material.fileName || "resource")}"`,
    );
    return res.sendFile(absolutePath);
  } catch (error) {
    console.error("Error serving study material file:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
