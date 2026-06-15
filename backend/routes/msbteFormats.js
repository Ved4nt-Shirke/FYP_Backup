const express = require("express");
const router = express.Router();
const SaPrK4 = require("../models/SaPrK4");
const TermAnalysisK7 = require("../models/TermAnalysisK7");
const IndustrialVisitK8 = require("../models/IndustrialVisitK8");
const ExpertLectureK9 = require("../models/ExpertLectureK9");
const { authenticate } = require("../middleware/auth");

// ==========================================
// SA-PR K4 ROUTES
// ==========================================

// GET SA-PR K4 record by CIANN + division
router.get("/sa-pr-k4", authenticate, async (req, res) => {
  try {
    const { ciannId, division } = req.query;

    if (!ciannId || !division) {
      return res
        .status(400)
        .json({ success: false, message: "ciannId and division are required" });
    }

    const record = await SaPrK4.findOne({
      ciannId: Number(ciannId),
      division: String(division),
    });

    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE/UPDATE SA-PR K4 record
router.post("/sa-pr-k4/save", authenticate, async (req, res) => {
  try {
    const {
      ciannId,
      subjectName,
      subjectCode,
      courseCode,
      academicYear,
      division,
      examDate,
      maxMarks,
      minMarks,
      students,
    } = req.body;

    if (!ciannId || !division || !subjectName || maxMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "ciannId, division, subjectName, and maxMarks are required",
      });
    }

    if (!Array.isArray(students)) {
      return res
        .status(400)
        .json({ success: false, message: "students must be an array" });
    }

    const sanitizedStudents = students.map((student) => ({
      studentId: student.studentId || undefined,
      rollNo: student.rollNo || "",
      enrollmentNo: student.enrollmentNo || "",
      studentName: student.studentName || "",
      seatNo: student.seatNo || "",
      marks:
        student.marks === "" || student.marks === null
          ? undefined
          : Number(student.marks),
    }));

    const update = {
      ciannId: Number(ciannId),
      subjectName: String(subjectName),
      subjectCode: subjectCode ? String(subjectCode) : "",
      courseCode: courseCode ? String(courseCode) : "",
      academicYear: academicYear ? String(academicYear) : "",
      division: String(division),
      examDate: examDate ? new Date(examDate) : undefined,
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks || 0),
      owner: req.user?._id,
      ownerUsername: req.user?.userName || req.user?.username || "",
      students: sanitizedStudents,
    };

    const record = await SaPrK4.findOneAndUpdate(
      { ciannId: Number(ciannId), division: String(division) },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================
// TERM ANALYSIS K7 ROUTES
// ==========================================

// GET K7 Term Analysis
router.get("/term-analysis-k7", authenticate, async (req, res) => {
  try {
    const { ciannId, id } = req.query;

    if (id) {
      const record = await TermAnalysisK7.findById(id);
      return res.json({ success: true, data: record });
    }

    if (ciannId) {
      const record = await TermAnalysisK7.findOne({
        ciannId: Number(ciannId),
      });
      return res.json({ success: true, data: record || null });
    }

    let query = {};
    if (req.user.role === "hod" || req.user.role === "academic_coordinator") {
      const User = require("../models/user");
      const userFilter = { college: req.user.college };
      if (req.user.department) {
        userFilter.department = req.user.department;
      }
      const usersInDept = await User.find(userFilter).select("_id");
      const userIds = usersInDept.map((u) => u._id);
      query = { owner: { $in: userIds } };
    } else {
      query = { owner: req.user._id };
    }

    const records = await TermAnalysisK7.find(query);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching Term Analysis K7 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// SAVE/UPDATE K7 Term Analysis
router.post("/term-analysis-k7/save", authenticate, async (req, res) => {
  try {
    const {
      id,
      ciannId,
      instituteName,
      academicYear,
      programme,
      division,
      semester,
      examType,
      courseCode,
      courseName,
      heads,
    } = req.body;

    if (!ciannId) {
      return res.status(400).json({
        success: false,
        message: "ciannId is required",
      });
    }

    const update = {
      ciannId: Number(ciannId),
      instituteName: instituteName || "",
      academicYear: academicYear || "",
      programme: programme || "",
      division: division || "",
      semester: semester || "",
      examType: examType || "",
      courseCode: courseCode || "",
      courseName: courseName || "",
      owner: req.user._id,
      ownerUsername: req.user.username || req.user.userName || "",
      heads: Array.isArray(heads) ? heads : [],
    };

    let record;
    if (id) {
      let query = { _id: id };
      if (req.user.role !== "hod" && req.user.role !== "academic_coordinator") {
        query.owner = req.user._id;
      }
      const existing = await TermAnalysisK7.findOne(query);
      if (!existing) {
        return res.status(403).json({ success: false, message: "Unauthorized to edit this record" });
      }
      record = await TermAnalysisK7.findByIdAndUpdate(id, update, { new: true });
    } else {
      const existing = await TermAnalysisK7.findOne({ ciannId: Number(ciannId) });
      if (existing && req.user.role !== "hod" && req.user.role !== "academic_coordinator") {
        if (String(existing.owner) !== String(req.user._id)) {
          return res.status(403).json({ success: false, message: "Unauthorized to overwrite this record" });
        }
      }
      record = await TermAnalysisK7.findOneAndUpdate(
        { ciannId: Number(ciannId) },
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving Term Analysis K7 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE K7 Term Analysis
router.delete("/term-analysis-k7/:id", authenticate, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== "hod" && req.user.role !== "academic_coordinator") {
      query.owner = req.user._id;
    }

    const record = await TermAnalysisK7.findOneAndDelete(query);

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found or unauthorized" });
    }

    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting Term Analysis record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================
// INDUSTRIAL VISIT K8 ROUTES
// ==========================================

router.get("/industrial-visit/k8", authenticate, async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const record = await IndustrialVisitK8.findById(id);
      return res.json({ success: true, data: record });
    }
    const records = await IndustrialVisitK8.find({ owner: req.user._id });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching K8 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/industrial-visit/k8/save", authenticate, async (req, res) => {
  try {
    const { id, ciannId, division, instituteName, academicYear, programme, entries } = req.body;
    
    const update = {
      ciannId: ciannId ? Number(ciannId) : undefined,
      division: division || "",
      instituteName: instituteName || "",
      academicYear: academicYear || "",
      programme: programme || "",
      entries: Array.isArray(entries) ? entries : [],
      owner: req.user._id,
    };

    let record;
    if (id) {
      record = await IndustrialVisitK8.findByIdAndUpdate(id, update, { new: true });
    } else {
      record = await IndustrialVisitK8.create(update);
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving K8 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/industrial-visit/k8/:id", authenticate, async (req, res) => {
  try {
    const record = await IndustrialVisitK8.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting K8 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================
// EXPERT LECTURE K9 ROUTES
// ==========================================

router.get("/expert-lecture/k9", authenticate, async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const record = await ExpertLectureK9.findById(id);
      return res.json({ success: true, data: record });
    }
    const records = await ExpertLectureK9.find({ owner: req.user._id });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching K9 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/expert-lecture/k9/save", authenticate, async (req, res) => {
  try {
    const { id, ciannId, division, instituteName, academicYear, programme, entries } = req.body;
    
    const update = {
      ciannId: ciannId ? Number(ciannId) : undefined,
      division: division || "",
      instituteName: instituteName || "",
      academicYear: academicYear || "",
      programme: programme || "",
      entries: Array.isArray(entries) ? entries : [],
      owner: req.user._id,
    };

    let record;
    if (id) {
      record = await ExpertLectureK9.findByIdAndUpdate(id, update, { new: true });
    } else {
      record = await ExpertLectureK9.create(update);
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving K9 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/expert-lecture/k9/:id", authenticate, async (req, res) => {
  try {
    const record = await ExpertLectureK9.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting K9 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
