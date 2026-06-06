const express = require("express");
const router = express.Router();
const SaPrK4 = require("../models/SaPrK4");
const IndustrialVisitK8 = require("../models/IndustrialVisitK8");
const ExpertLectureK9 = require("../models/ExpertLectureK9");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// --- SA-PR K4 ---
// GET SA-PR K4 record by CIANN + division
router.get("/sa-pr-k4", async (req, res) => {
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
      owner: req.user._id,
    });

    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE/UPDATE SA-PR K4
router.post("/sa-pr-k4/save", async (req, res) => {
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
      owner: req.user._id,
      ownerUsername: req.user.username || "",
      students: sanitizedStudents,
    };

    const record = await SaPrK4.findOneAndUpdate(
      { ciannId: Number(ciannId), division: String(division), owner: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// --- Industrial Visit (K8) ---
// GET K8
router.get("/industrial-visit/k8", async (req, res) => {
  try {
    const { ciannId, division, id } = req.query;

    if (id) {
      const record = await IndustrialVisitK8.findById(String(id));
      return res.json({ success: true, data: record || null });
    }

    if (!ciannId && !division) {
      // List all for this owner
      const records = await IndustrialVisitK8.find({ owner: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: records });
    }

    const query = { owner: req.user._id };
    if (ciannId) query.ciannId = Number(ciannId);
    if (division) query.division = String(division);

    const record = await IndustrialVisitK8.findOne(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching K8 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// SAVE/UPDATE K8
router.post("/industrial-visit/k8/save", async (req, res) => {
  try {
    const { id, ciannId, division, instituteName, academicYear, programme, entries } = req.body;

    if (!division) {
      return res.status(400).json({ success: false, message: "division is required" });
    }

    const sanitizedEntries = Array.isArray(entries)
      ? entries.map((e, idx) => ({
          srNo: e.srNo || idx + 1,
          dateOfVisit: e.dateOfVisit ? new Date(e.dateOfVisit) : undefined,
          yearSemester: e.yearSemester || "",
          industryName: e.industryName || "",
          coordinatorName: e.coordinatorName || "",
          beneficiaries: e.beneficiaries || "",
          relevanceToCourse: e.relevanceToCourse || "",
          mappingWithPO: e.mappingWithPO || "",
        }))
      : [];

    const update = {
      ciannId: ciannId ? Number(ciannId) : undefined,
      division: String(division),
      instituteName: instituteName ? String(instituteName) : "",
      academicYear: academicYear ? String(academicYear) : "",
      programme: programme ? String(programme) : "",
      entries: sanitizedEntries,
      owner: req.user._id,
    };

    let record;
    if (id) {
      record = await IndustrialVisitK8.findOneAndUpdate(
        { _id: id, owner: req.user._id },
        update,
        { new: true }
      );
    } else {
      // Upsert by ciannId, division, owner
      const query = { owner: req.user._id, division: update.division };
      if (update.ciannId) query.ciannId = update.ciannId;

      record = await IndustrialVisitK8.findOneAndUpdate(
        query,
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving K8 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE K8
router.delete("/industrial-visit/k8/:id", async (req, res) => {
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


// --- Expert Lecture (K9) ---
// GET K9
router.get("/expert-lecture/k9", async (req, res) => {
  try {
    const { ciannId, division, id } = req.query;

    if (id) {
      const record = await ExpertLectureK9.findById(String(id));
      return res.json({ success: true, data: record || null });
    }

    if (!ciannId && !division) {
      // List all for this owner
      const records = await ExpertLectureK9.find({ owner: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: records });
    }

    const query = { owner: req.user._id };
    if (ciannId) query.ciannId = Number(ciannId);
    if (division) query.division = String(division);

    const record = await ExpertLectureK9.findOne(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching K9 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// SAVE/UPDATE K9
router.post("/expert-lecture/k9/save", async (req, res) => {
  try {
    const { id, ciannId, division, instituteName, academicYear, programme, entries } = req.body;

    if (!division) {
      return res.status(400).json({ success: false, message: "division is required" });
    }

    const sanitizedEntries = Array.isArray(entries)
      ? entries.map((e, idx) => ({
          srNo: e.srNo || idx + 1,
          expertDetails: e.expertDetails || "",
          dateOfExpertLecture: e.dateOfExpertLecture ? new Date(e.dateOfExpertLecture) : undefined,
          topic: e.topic || "",
          yearSemester: e.yearSemester || "",
          coordinatorName: e.coordinatorName || "",
          studentsAttended: e.studentsAttended !== undefined ? String(e.studentsAttended) : "",
          relevanceToPO: e.relevanceToPO || "",
        }))
      : [];

    const update = {
      ciannId: ciannId ? Number(ciannId) : undefined,
      division: String(division),
      instituteName: instituteName ? String(instituteName) : "",
      academicYear: academicYear ? String(academicYear) : "",
      programme: programme ? String(programme) : "",
      entries: sanitizedEntries,
      owner: req.user._id,
    };

    let record;
    if (id) {
      record = await ExpertLectureK9.findOneAndUpdate(
        { _id: id, owner: req.user._id },
        update,
        { new: true }
      );
    } else {
      // Upsert by ciannId, division, owner
      const query = { owner: req.user._id, division: update.division };
      if (update.ciannId) query.ciannId = update.ciannId;

      record = await ExpertLectureK9.findOneAndUpdate(
        query,
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving K9 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE K9
router.delete("/expert-lecture/k9/:id", async (req, res) => {
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
