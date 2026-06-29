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
const StudentMaterialProgress = require("../models/StudentMaterialProgress");

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
  limits: { fileSize: 100 * 1024 * 1024 }, // increased to 100MB for video uploads
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream", // Fallback for some zips/binaries
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];

    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
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

// Faculty: Publish new material
router.post("/faculty", ensureFaculty, upload.single("resourceFile"), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      category,
      resourceType,
      externalUrl,
      richTextContent,
      departmentId,
      courseId,
      divisionId,
      academicYear,
      semester,
      chapterNo,
      chapterName,
      tags,
      isDraft,
      thumbnailData,
    } = req.body;

    if (!title || !category || !resourceType || !departmentId || !courseId || !divisionId) {
      return res.status(400).json({
        success: false,
        message: "Title, category, resource type, department, course and division are required",
      });
    }

    if (!["file", "link", "rich-text"].includes(String(resourceType))) {
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

    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === "string") {
        parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // Process base64 thumbnail if provided
    let thumbnailPath = "";
    if (thumbnailData) {
      try {
        const base64Data = thumbnailData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const thumbnailsDir = path.join(__dirname, "../uploads/study-materials/thumbnails");
        if (!fs.existsSync(thumbnailsDir)) {
          fs.mkdirSync(thumbnailsDir, { recursive: true });
        }
        const thumbFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-thumb.png`;
        fs.writeFileSync(path.join(thumbnailsDir, thumbFilename), buffer);
        thumbnailPath = `/uploads/study-materials/thumbnails/${thumbFilename}`;
      } catch (err) {
        console.error("Failed to save base64 thumbnail:", err);
      }
    }

    const material = await StudyMaterial.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      subject: String(subject || "General").trim(),
      category,
      resourceType,
      externalUrl: String(resourceType) === "link" ? String(externalUrl || "").trim() : "",
      richTextContent: String(resourceType) === "rich-text" ? String(richTextContent || "").trim() : "",
      fileName: req.file?.originalname || "",
      filePath: req.file?.path || "",
      fileMimeType: req.file?.mimetype || "",
      fileSize: req.file?.size || 0,
      thumbnailPath,
      departmentId,
      courseId,
      divisionId,
      divisionName: division.name,
      academicYear: academicYear || "",
      semester: semester ? Number(semester) : course.semester,
      chapterNo: chapterNo ? Number(chapterNo) : 0,
      chapterName: chapterName || "",
      tags: parsedTags,
      isDraft: String(isDraft) === "true",
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

// Faculty: Retrieve materials uploaded by the current faculty only
router.get("/faculty", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();
    const { divisionId, courseId, activeOnly } = req.query;

    const query = { institution, uploadedBy: req.user._id }; // Encrypting privacy: faculty only manages their own
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

// Faculty: Remove study material (Only uploader allowed)
router.delete("/faculty/:id", ensureFaculty, async (req, res) => {
  try {
    const institution = String(req.user.college || "").toUpperCase();

    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      institution,
      uploadedBy: req.user._id, // Enforce ownership check
    });

    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found or unauthorized" });
    }

    material.isActive = false;
    await material.save();

    return res.json({ success: true, message: "Study material removed successfully" });
  } catch (error) {
    console.error("Error removing study material:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Retrieve current materials with progress and advanced filters
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

    // Build matching query
    const query = {
      institution,
      isActive: true,
      isDraft: { $ne: true }, // Filter drafts
    };

    if (student.courseId) {
      query.courseId = student.courseId;
    }

    if (divisionId) {
      query.divisionId = divisionId;
    } else if (student.division) {
      query.divisionName = { $regex: exactRegex(student.division) };
    }

    // Advanced search filters
    const {
      subject,
      chapterNo,
      category,
      academicYear,
      semester,
      resourceType,
      tags,
      search,
    } = req.query;

    if (subject) {
      query.subject = { $regex: exactRegex(subject) };
    }
    if (chapterNo) {
      query.chapterNo = Number(chapterNo);
    }
    if (category && category !== "all" && category !== "All") {
      query.category = category;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (semester) {
      query.semester = Number(semester);
    }
    if (resourceType && resourceType !== "all") {
      query.resourceType = resourceType;
    }
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query.tags = { $in: tagList };
      }
    }
    if (search) {
      const escaped = escapeRegex(search);
      const searchRegex = new RegExp(escaped, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { uploadedByName: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const [materials, progressList] = await Promise.all([
      StudyMaterial.find(query)
        .populate("courseId", "courseCode semester scheme")
        .populate("divisionId", "name")
        .sort({ chapterNo: 1, createdAt: -1 }),
      StudentMaterialProgress.find({ studentId: student._id }),
    ]);

    const progressMap = {};
    progressList.forEach((p) => {
      progressMap[String(p.materialId)] = p;
    });

    const normalized = materials.map((item) => {
      const prog = progressMap[String(item._id)] || {};
      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        subject: item.subject || "General",
        type: item.category,
        category: item.category,
        resourceType: item.resourceType,
        richTextContent: item.richTextContent || "",
        thumbnailPath: item.thumbnailPath || "",
        size: item.resourceType === "file" ? formatBytes(item.fileSize) : "Link",
        fileSize: item.fileSize,
        date: item.createdAt,
        division: item.divisionId?.name || item.divisionName,
        course: item.courseId?.courseCode || "",
        externalUrl: item.externalUrl || "",
        downloadUrl: item.resourceType === "file" ? `/api/study-materials/file/${item._id}` : item.externalUrl,
        academicYear: item.academicYear || "",
        semester: item.semester || 1,
        chapterNo: item.chapterNo || 0,
        chapterName: item.chapterName || "",
        tags: item.tags || [],
        uploadedByName: item.uploadedByName || "",
        isBookmarked: !!prog.isBookmarked,
        isCompleted: !!prog.isCompleted,
        videoProgress: prog.videoProgress || { playedSeconds: 0, playedPercentage: 0 },
        lastViewedAt: prog.lastViewedAt || null,
      };
    });

    return res.json({
      success: true,
      materials: normalized,
    });
  } catch (error) {
    console.error("Error fetching student study materials:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Update progress (bookmark, mark completed, watch progress)
router.post("/student/progress", ensureStudent, async (req, res) => {
  try {
    const student = await findStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const { materialId, isBookmarked, isCompleted, videoProgress } = req.body;

    if (!materialId) {
      return res.status(400).json({ success: false, message: "Material ID is required" });
    }

    const updateFields = { lastViewedAt: new Date() };
    if (isBookmarked !== undefined) updateFields.isBookmarked = isBookmarked;
    if (isCompleted !== undefined) updateFields.isCompleted = isCompleted;
    if (videoProgress) {
      updateFields.videoProgress = {
        playedSeconds: Number(videoProgress.playedSeconds || 0),
        playedPercentage: Number(videoProgress.playedPercentage || 0),
        lastWatchedAt: new Date(),
      };
    }

    const progress = await StudentMaterialProgress.findOneAndUpdate(
      { studentId: student._id, materialId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return res.json({ success: true, progress });
  } catch (error) {
    console.error("Error updating student progress:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Fetch recently viewed study materials
router.get("/student/recently-viewed", ensureStudent, async (req, res) => {
  try {
    const student = await findStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const progresses = await StudentMaterialProgress.find({
      studentId: student._id,
      lastViewedAt: { $exists: true },
    })
      .sort({ lastViewedAt: -1 })
      .limit(8);

    const materialIds = progresses.map((p) => p.materialId);

    const materials = await StudyMaterial.find({
      _id: { $in: materialIds },
      isActive: true,
      isDraft: { $ne: true },
    })
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name");

    const formatted = progresses
      .map((p) => {
        const item = materials.find((m) => String(m._id) === String(p.materialId));
        if (!item) return null;
        return {
          _id: item._id,
          title: item.title,
          description: item.description,
          subject: item.subject || "General",
          category: item.category,
          resourceType: item.resourceType,
          thumbnailPath: item.thumbnailPath || "",
          size: item.resourceType === "file" ? formatBytes(item.fileSize) : "Link",
          downloadUrl: item.resourceType === "file" ? `/api/study-materials/file/${item._id}` : item.externalUrl,
          externalUrl: item.externalUrl || "",
          isBookmarked: !!p.isBookmarked,
          isCompleted: !!p.isCompleted,
          videoProgress: p.videoProgress || { playedSeconds: 0, playedPercentage: 0 },
        };
      })
      .filter(Boolean);

    return res.json({ success: true, materials: formatted });
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Fetch continue watching videos
router.get("/student/continue-watching", ensureStudent, async (req, res) => {
  try {
    const student = await findStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const progresses = await StudentMaterialProgress.find({
      studentId: student._id,
      "videoProgress.playedPercentage": { $gt: 2, $lt: 95 },
    })
      .sort({ "videoProgress.lastWatchedAt": -1 })
      .limit(8);

    const materialIds = progresses.map((p) => p.materialId);

    const materials = await StudyMaterial.find({
      _id: { $in: materialIds },
      isActive: true,
      isDraft: { $ne: true },
    })
      .populate("courseId", "courseCode semester scheme")
      .populate("divisionId", "name");

    const formatted = progresses
      .map((p) => {
        const item = materials.find((m) => String(m._id) === String(p.materialId));
        if (!item) return null;
        return {
          _id: item._id,
          title: item.title,
          description: item.description,
          subject: item.subject || "General",
          category: item.category,
          resourceType: item.resourceType,
          thumbnailPath: item.thumbnailPath || "",
          downloadUrl: item.resourceType === "file" ? `/api/study-materials/file/${item._id}` : item.externalUrl,
          externalUrl: item.externalUrl || "",
          isBookmarked: !!p.isBookmarked,
          isCompleted: !!p.isCompleted,
          videoProgress: p.videoProgress,
        };
      })
      .filter(Boolean);

    return res.json({ success: true, materials: formatted });
  } catch (error) {
    console.error("Error fetching continue watching:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET file content by ID (with security permissions)
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

    if (material.isDraft && String(material.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized access to private draft" });
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
