const express = require("express");
const router = express.Router();
const SaPrK4 = require("../models/SaPrK4");
const SaTh = require("../models/SaTh");
const Student = require("../models/Student");
const { resolveStudents } = require("../utils/studentHistoryHelper");
const Division = require("../models/Division");
const Course = require("../models/Course");
const Subject = require("../models/Subject");
const Ciaan = require("../models/Ciann");
const CTMarks = require("../models/CTMarks");
const PTMicroProject = require("../models/PTMicroProject");
const Assessment = require("../models/Assessment");
const StudentResult = require("../models/StudentResult");
const TermAnalysisK7 = require("../models/TermAnalysisK7");
const K7Result = require("../models/K7Result");
const IndustrialVisitK8 = require("../models/IndustrialVisitK8");
const ExpertLectureK9 = require("../models/ExpertLectureK9");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// ==========================================
// SA-PR K4 ROUTES
// ==========================================

// GET SA-PR K4 record by Ciaan + division
router.get("/sa-pr-k4", authenticate, async (req, res) => {
  try {
    const { CiaanId, division } = req.query;

    if (!CiaanId || !division) {
      return res
        .status(400)
        .json({ success: false, message: "CiaanId and division are required" });
    }

    const record = await SaPrK4.findOne({
      CiaanId: Number(CiaanId),
      division: String(division),
      owner: req.user._id,
    });

    let data = null;
    if (record) {
      // Fetch latest seat numbers from Student collection to overwrite snapshots
      data = record.toObject();
      const studentIds = data.students.map((s) => s.studentId).filter(Boolean);

      const dbStudents = await Student.find({
        institution: req.user.college,
        $or: [
          { _id: { $in: studentIds } },
          { division: String(division) }
        ]
      }).select("_id rollNo enrollmentNo seatNo");

      const seatMap = new Map();
      const seatMapByRoll = new Map();
      const seatMapByEnroll = new Map();

      dbStudents.forEach((s) => {
        const seatVal = (s.seatNo || "").toString().trim();
        if (seatVal) {
          seatMap.set(s._id.toString(), seatVal);
          if (s.rollNo) {
            seatMapByRoll.set(s.rollNo.toString().trim().toLowerCase(), seatVal);
          }
          if (s.enrollmentNo) {
            seatMapByEnroll.set(s.enrollmentNo.toString().trim().toLowerCase(), seatVal);
          }
        }
      });

      data.students = data.students.map((s) => {
        let currentSeatNo = s.seatNo || "";
        if (s.studentId && seatMap.has(s.studentId.toString())) {
          currentSeatNo = seatMap.get(s.studentId.toString());
        } else if (s.enrollmentNo && seatMapByEnroll.has(s.enrollmentNo.toString().trim().toLowerCase())) {
          currentSeatNo = seatMapByEnroll.get(s.enrollmentNo.toString().trim().toLowerCase());
        } else if (s.rollNo && seatMapByRoll.has(s.rollNo.toString().trim().toLowerCase())) {
          currentSeatNo = seatMapByRoll.get(s.rollNo.toString().trim().toLowerCase());
        }
        return {
          ...s,
          seatNo: currentSeatNo
        };
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching SA-PR K4 record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE/UPDATE SA-PR K4 record
router.post("/sa-pr-k4/save", authenticate, async (req, res) => {
  try {
    const {
      CiaanId,
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

    if (!CiaanId || !division || !subjectName || maxMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "CiaanId, division, subjectName, and maxMarks are required",
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
      CiaanId: Number(CiaanId),
      subjectName: String(subjectName),
      subjectCode: subjectCode ? String(subjectCode) : "",
      courseCode: courseCode ? String(courseCode) : "",
      academicYear: academicYear ? String(academicYear) : "",
      division: String(division),
      examDate: examDate ? new Date(examDate) : undefined,
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks || 0),
      owner: req.user._id,
      ownerUsername: req.user.userName || req.user.username || "",
      students: sanitizedStudents,
    };

    const record = await SaPrK4.findOneAndUpdate(
      { CiaanId: Number(CiaanId), division: String(division), owner: req.user._id },
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
// SA-TH ROUTES
// ==========================================

// GET SA-TH record by Ciaan + division
router.get("/sa-th", authenticate, async (req, res) => {
  try {
    const { CiaanId, division } = req.query;

    if (!CiaanId || !division) {
      return res
        .status(400)
        .json({ success: false, message: "CiaanId and division are required" });
    }

    const record = await SaTh.findOne({
      CiaanId: Number(CiaanId),
      division: String(division),
      owner: req.user._id,
    });

    let data = null;
    if (record) {
      // Fetch latest seat numbers from Student collection to overwrite snapshots
      data = record.toObject();
      const studentIds = data.students.map((s) => s.studentId).filter(Boolean);

      const dbStudents = await Student.find({
        $or: [
          { _id: { $in: studentIds } },
          { division: String(division) }
        ]
      }).select("_id rollNo enrollmentNo seatNo");

      const seatMap = new Map();
      const seatMapByRoll = new Map();
      const seatMapByEnroll = new Map();

      dbStudents.forEach((s) => {
        const seatVal = (s.seatNo || "").toString().trim();
        if (seatVal) {
          seatMap.set(s._id.toString(), seatVal);
          if (s.rollNo) {
            seatMapByRoll.set(s.rollNo.toString().trim().toLowerCase(), seatVal);
          }
          if (s.enrollmentNo) {
            seatMapByEnroll.set(s.enrollmentNo.toString().trim().toLowerCase(), seatVal);
          }
        }
      });

      data.students = data.students.map((s) => {
        let currentSeatNo = s.seatNo || "";
        if (s.studentId && seatMap.has(s.studentId.toString())) {
          currentSeatNo = seatMap.get(s.studentId.toString());
        } else if (s.enrollmentNo && seatMapByEnroll.has(s.enrollmentNo.toString().trim().toLowerCase())) {
          currentSeatNo = seatMapByEnroll.get(s.enrollmentNo.toString().trim().toLowerCase());
        } else if (s.rollNo && seatMapByRoll.has(s.rollNo.toString().trim().toLowerCase())) {
          currentSeatNo = seatMapByRoll.get(s.rollNo.toString().trim().toLowerCase());
        }
        return {
          ...s,
          seatNo: currentSeatNo
        };
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching SA-TH record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE/UPDATE SA-TH record
router.post("/sa-th/save", authenticate, async (req, res) => {
  try {
    const {
      CiaanId,
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

    if (!CiaanId || !division || !subjectName || maxMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "CiaanId, division, subjectName, and maxMarks are required",
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
        student.marks === "" || student.marks === null || student.marks === undefined
          ? undefined
          : Number(student.marks),
    }));

    const update = {
      CiaanId: Number(CiaanId),
      subjectName: String(subjectName),
      subjectCode: subjectCode ? String(subjectCode) : "",
      courseCode: courseCode ? String(courseCode) : "",
      academicYear: academicYear ? String(academicYear) : "",
      division: String(division),
      examDate: examDate ? new Date(examDate) : undefined,
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks || 0),
      owner: req.user._id,
      ownerUsername: req.user.userName || req.user.username || "",
      students: sanitizedStudents,
    };

    const record = await SaTh.findOneAndUpdate(
      { CiaanId: Number(CiaanId), division: String(division), owner: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error saving SA-TH record:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================
// TERM ANALYSIS K7 ROUTES
// ==========================================

// GET K7 Term Analysis
router.get("/term-analysis-k7", authenticate, async (req, res) => {
  try {
    const { CiaanId, id } = req.query;

    if (id) {
      const record = await TermAnalysisK7.findById(id);
      return res.json({ success: true, data: record });
    }

    if (CiaanId) {
      const record = await TermAnalysisK7.findOne({
        CiaanId: Number(CiaanId),
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
      CiaanId,
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

    if (!CiaanId) {
      return res.status(400).json({
        success: false,
        message: "CiaanId is required",
      });
    }

    const update = {
      CiaanId: Number(CiaanId),
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
      const existing = await TermAnalysisK7.findOne({ CiaanId: Number(CiaanId) });
      if (existing && req.user.role !== "hod" && req.user.role !== "academic_coordinator") {
        if (String(existing.owner) !== String(req.user._id)) {
          return res.status(403).json({ success: false, message: "Unauthorized to overwrite this record" });
        }
      }
      record = await TermAnalysisK7.findOneAndUpdate(
        { CiaanId: Number(CiaanId) },
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

// GET K8
router.get("/industrial-visit/k8", async (req, res) => {
  try {
    const { CiaanId, division, id } = req.query;

    if (id) {
      const record = await IndustrialVisitK8.findById(String(id));
      return res.json({ success: true, data: record || null });
    }

    if (!CiaanId && !division) {
      // List all for this owner
      const records = await IndustrialVisitK8.find({ owner: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: records });
    }

    const query = { owner: req.user._id };
    if (CiaanId) query.CiaanId = Number(CiaanId);
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
    const { id, CiaanId, division, instituteName, academicYear, programme, entries } = req.body;

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
      CiaanId: CiaanId ? Number(CiaanId) : undefined,
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
      // Upsert by CiaanId, division, owner
      const query = { owner: req.user._id, division: update.division };
      if (update.CiaanId) query.CiaanId = update.CiaanId;

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

// ==========================================
// EXPERT LECTURE K9 ROUTES
// ==========================================

// GET K9
router.get("/expert-lecture/k9", async (req, res) => {
  try {
    const { CiaanId, division, id } = req.query;

    if (id) {
      const record = await ExpertLectureK9.findById(String(id));
      return res.json({ success: true, data: record || null });
    }

    if (!CiaanId && !division) {
      // List all for this owner
      const records = await ExpertLectureK9.find({ owner: req.user._id }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: records });
    }

    const query = { owner: req.user._id };
    if (CiaanId) query.CiaanId = Number(CiaanId);
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
    const { id, CiaanId, division, instituteName, academicYear, programme, entries } = req.body;

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
      CiaanId: CiaanId ? Number(CiaanId) : undefined,
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
      // Upsert by CiaanId, division, owner
      const query = { owner: req.user._id, division: update.division };
      if (update.CiaanId) query.CiaanId = update.CiaanId;

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

// ==========================================
// K7 RESULT ANALYSIS ROUTES
// ==========================================

// GET list of saved K7 records for owner
router.get("/k7/list", async (req, res) => {
  try {
    const records = await K7Result.find({ owner: req.user._id })
      .populate("departmentId", "name")
      .populate("divisionId", "name")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error listing K7 records:", error);
    res.status(500).json({ success: false, message: "Server error listing K7 records" });
  }
});

// GET K7 record
router.get("/k7", async (req, res) => {
  try {
    const { academicYear, semester, departmentId, divisionId } = req.query;

    if (!academicYear || !semester || !departmentId || !divisionId) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const record = await K7Result.findOne({
      academicYear,
      semester,
      departmentId,
      divisionId
    });

    res.json({ success: true, data: record || null });
  } catch (error) {
    console.error("Error fetching K7 Result:", error);
    res.status(500).json({ success: false, message: "Server error fetching K7 record" });
  }
});

// SAVE/UPDATE K7 record (consolidated for all courses)
router.post("/k7/save", async (req, res) => {
  try {
    const {
      academicYear,
      semester,
      departmentId,
      divisionId,
      courseConfigs, // Array of { courseCode, courseName, maxMarks }
      studentMarks,  // [ { studentId, rollNo, studentName, courses: [ { courseCode, ct1, ct2, ... } ] } ]
      courseStats    // Array of { courseCode, stats: [ { passingHead, lowest, highest, appeared, passed, passPct, above60Pct } ] }
    } = req.body;

    if (!academicYear || !semester || !departmentId || !divisionId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find existing record
    let record = await K7Result.findOne({
      academicYear,
      semester,
      departmentId,
      divisionId
    });

    if (!record) {
      record = new K7Result({
        academicYear,
        semester,
        departmentId,
        divisionId,
        owner: req.user._id,
        courseConfigs: [],
        studentMarks: [],
        courseStats: []
      });
    }

    // 1. Update configurations (merge by courseCode)
    if (Array.isArray(courseConfigs)) {
      const mergedConfigs = [...(record.courseConfigs || [])];
      courseConfigs.forEach(newConf => {
        const idx = mergedConfigs.findIndex(c => c.courseCode === newConf.courseCode);
        if (idx >= 0) {
          mergedConfigs[idx] = newConf;
        } else {
          mergedConfigs.push(newConf);
        }
      });
      record.courseConfigs = mergedConfigs;
    }

    // 2. Update student marks snapshot (merge courses course-wise)
    if (Array.isArray(studentMarks) && studentMarks.length > 0) {
      const mergedStudentMarks = [...(record.studentMarks || [])];
      studentMarks.forEach(newStud => {
        const idx = mergedStudentMarks.findIndex(s => s.studentId?.toString() === newStud.studentId?.toString());
        if (idx >= 0) {
          const existingCourses = [...(mergedStudentMarks[idx].courses || [])];
          (newStud.courses || []).forEach(newCourse => {
            const cIdx = existingCourses.findIndex(c => c.courseCode === newCourse.courseCode);
            if (cIdx >= 0) {
              existingCourses[cIdx] = newCourse;
            } else {
              existingCourses.push(newCourse);
            }
          });
          mergedStudentMarks[idx].courses = existingCourses;
        } else {
          mergedStudentMarks.push(newStud);
        }
      });
      record.studentMarks = mergedStudentMarks;
    }

    // 3. Update summary statistics (merge by courseCode)
    if (Array.isArray(courseStats)) {
      const mergedStats = [...(record.courseStats || [])];
      courseStats.forEach(newStat => {
        const idx = mergedStats.findIndex(s => s.courseCode === newStat.courseCode);
        if (idx >= 0) {
          mergedStats[idx] = newStat;
        } else {
          mergedStats.push(newStat);
        }
      });
      record.courseStats = mergedStats;
    }

    await record.save();
    res.json({ success: true, data: record });

  } catch (error) {
    console.error("Error saving K7 Result:", error);
    res.status(500).json({ success: false, message: "Server error during save" });
  }
});

// POPULATE K7 record from database
router.get("/k7/populate", async (req, res) => {
  try {
    const { academicYear, semester, departmentId, divisionId, CiaanId } = req.query;

    if (!academicYear || !semester || !departmentId || !divisionId) {
      return res.status(400).json({ success: false, message: "Missing required query parameters" });
    }

    // 1. Fetch division name
    const divisionObj = await Division.findById(divisionId);
    if (!divisionObj) {
      return res.status(404).json({ success: false, message: "Division not found" });
    }
    const divisionName = divisionObj.name;

    // 2. Fetch all students in this division for the specific academic year
    const students = await resolveStudents({
      departmentId,
      divisionId,
      academicYear,
      semester
    }, req.user.college);
    if (students.length === 0) {
      return res.json({ success: true, courseConfigs: [], studentMarks: [], message: "No students found in this division" });
    }

    // 3. Find courses
    const semNum = parseInt(semester);
    const courses = await Course.find({
      departmentId,
      $or: [{ semester: semNum }, { semester: semester }]
    });

    const courseIds = courses.map(c => c._id);

    // 4. Find subjects
    let subjects = [];
    let targetCiaan = null;
    if (CiaanId) {
      targetCiaan = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
      if (targetCiaan) {
        subjects = await Subject.find({
          courseId: { $in: courseIds },
          $or: [
            { code: targetCiaan.subject?.code },
            { name: targetCiaan.subject?.name }
          ]
        });
      }
    }

    if (subjects.length === 0) {
      subjects = await Subject.find({
        courseId: { $in: courseIds }
      }).sort({ code: 1 });
    }

    // Initialize course configs with default MSBTE maximum marks
    const courseConfigs = subjects.map(sub => ({
      courseCode: sub.code,
      courseName: sub.name,
      maxMarks: {
        ct1: 30,
        ct2: 30,
        finalFaTh: 30,
        faTh: 30,
        saTh: 70,
        faPr: 25,
        saPr: 25,
        sla: 25
      }
    }));

    // Find all Ciaans matching this department, divisionName, academicYear, and semester
    const semesterStr = semester.toString();
    const CiaanQuery = {
      "department._id": departmentId.toString(),
      division: divisionName,
      academicYear,
      $or: [
        { semester: semesterStr },
        { semester: semNum.toString() }
      ]
    };
    if (CiaanId) {
      CiaanQuery.CiaanId = Number(CiaanId);
    }

    const Ciaans = await Ciaan.find(CiaanQuery);
    const CiaanIds = Ciaans.map(c => c.CiaanId);

    // Fetch related marks in bulk
    const ctMarksList = await CTMarks.find({ CiaanId: { $in: CiaanIds } });
    const microProjectsList = await PTMicroProject.find({ CiaanId: { $in: CiaanIds }, activityType: "Microproject" });
    const assessmentsList = await Assessment.find({ CiaanId: { $in: CiaanIds } });
    const saPrK4List = await SaPrK4.find({ CiaanId: { $in: CiaanIds }, division: divisionName });
    const saThList = await SaTh.find({ CiaanId: { $in: CiaanIds }, division: divisionName });

    // Fetch StudentResults (SA-TH)
    const studentIds = students.map(s => s._id);
    const studentResultsList = await StudentResult.find({
      studentId: { $in: studentIds },
      $or: [
        { semester: semesterStr },
        { semester: `Semester ${semesterStr}` },
        { semester: `Semester ${semNum}` }
      ]
    });

    // Populate marks for each student
    const studentMarks = [];

    for (const student of students) {
      const studentIdStr = student._id.toString();
      const rollNoStr = (student.rollNo || "").toString().trim().toLowerCase();
      const studentNameStr = (student.studentName || "").toString().trim().toLowerCase();

      const studentCourseMarks = [];

      for (const sub of subjects) {
        const subCode = sub.code;
        const subName = sub.name;

        // Find matching Ciaan
        const CiaanObj = Ciaans.find(c =>
          (c.subject?.code && c.subject.code.toString() === subCode.toString()) ||
          (c.subject?.name && c.subject.name.toString().toLowerCase() === subName.toLowerCase())
        );

        let ct1 = null;
        let ct2 = null;
        let finalFaTh = null;
        let faPr = null;
        let saPr = null;
        let saTh = null;
        let sla = null;

        if (CiaanObj) {
          const cId = CiaanObj.CiaanId;

          // 1. CT Marks
          const studentCT1 = ctMarksList.find(m =>
            m.CiaanId === cId &&
            m.ctNumber === 1 &&
            (
              (m.rollNo && m.rollNo.toString().trim().toLowerCase() === rollNoStr) ||
              (m.studentName && m.studentName.toString().trim().toLowerCase() === studentNameStr)
            )
          );
          if (studentCT1) ct1 = studentCT1.marks;

          const studentCT2 = ctMarksList.find(m =>
            m.CiaanId === cId &&
            m.ctNumber === 2 &&
            (
              (m.rollNo && m.rollNo.toString().trim().toLowerCase() === rollNoStr) ||
              (m.studentName && m.studentName.toString().trim().toLowerCase() === studentNameStr)
            )
          );
          if (studentCT2) ct2 = studentCT2.marks;

          // 2. Microproject (Final FA-TH)
          const studentMP = microProjectsList.find(m =>
            m.CiaanId === cId &&
            m.studentId?.toString() === studentIdStr
          );
          if (studentMP) finalFaTh = studentMP.marks;

          // 3. FA-PR (Continuous Assessment average)
          const studentAssessments = assessmentsList.filter(a =>
            a.CiaanId === cId &&
            (
              (a.rollNo && a.rollNo.toString().trim().toLowerCase() === rollNoStr) ||
              (a.studentName && a.studentName.toString().trim().toLowerCase() === studentNameStr)
            )
          );
          if (studentAssessments.length > 0) {
            const sum = studentAssessments.reduce((acc, curr) => acc + (curr.marks || 0), 0);
            faPr = Math.round(sum / studentAssessments.length);
          }

          // 4. SA-PR (SaPrK4 marks)
          const saPrRecord = saPrK4List.find(r => r.CiaanId === cId);
          if (saPrRecord && Array.isArray(saPrRecord.students)) {
            const studentSaPr = saPrRecord.students.find(s =>
              (s.studentId && s.studentId.toString() === studentIdStr) ||
              (s.rollNo && s.rollNo.toString().trim().toLowerCase() === rollNoStr) ||
              (s.enrollmentNo && s.enrollmentNo.toString().trim().toLowerCase() === (student.enrollmentNo || "").toString().trim().toLowerCase())
            );
            if (studentSaPr && studentSaPr.marks !== undefined) saPr = studentSaPr.marks;
          }
        }

        // 5. SA-TH (SaTh marks or fallback to StudentResult)
        const saThRecord = saThList.find(r => r.CiaanId === cId);
        if (saThRecord && Array.isArray(saThRecord.students)) {
          const studentSaThObj = saThRecord.students.find(s =>
            (s.studentId && s.studentId.toString() === studentIdStr) ||
            (s.rollNo && s.rollNo.toString().trim().toLowerCase() === rollNoStr) ||
            (s.enrollmentNo && s.enrollmentNo.toString().trim().toLowerCase() === (student.enrollmentNo || "").toString().trim().toLowerCase())
          );
          if (studentSaThObj && studentSaThObj.marks !== undefined && studentSaThObj.marks !== null) {
            saTh = studentSaThObj.marks;
          }
        }

        if (saTh === null) {
          const studentRes = studentResultsList.find(r =>
            r.studentId?.toString() === studentIdStr &&
            (
              r.subject.toString().toLowerCase() === subName.toLowerCase() ||
              r.subject.toString() === subCode.toString()
            )
          );
          if (studentRes) saTh = studentRes.marks;
        }

        // Compute FA-TH = CT average + Final
        let ctAvg = null;
        if (ct1 !== null && ct2 !== null) {
          ctAvg = (ct1 + ct2) / 2;
        } else if (ct1 !== null) {
          ctAvg = ct1;
        } else if (ct2 !== null) {
          ctAvg = ct2;
        }

        let computedFaTh = ctAvg !== null ? Math.round(ctAvg) : null;

        studentCourseMarks.push({
          courseCode: subCode,
          ct1,
          ct2,
          finalFaTh: computedFaTh,
          faTh: computedFaTh,
          saTh,
          faPr,
          saPr,
          sla
        });
      }

      studentMarks.push({
        studentId: student._id,
        rollNo: student.rollNo,
        studentName: student.studentName,
        courses: studentCourseMarks
      });
    }

    res.json({
      success: true,
      courseConfigs,
      studentMarks
    });
  } catch (error) {
    console.error("Error in populate K7 Result:", error);
    res.status(500).json({ success: false, message: "Server error during population" });
  }
});

module.exports = router;
