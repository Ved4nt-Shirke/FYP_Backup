const express = require("express");
const router = express.Router();
const CTMarks = require("../models/CTMarks");
const Ciann = require("../models/Ciann");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Division = require("../models/Division");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

const parseCiannId = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const canAccessCiann = (ciann, user) => {
  if (!ciann || !user) return false;

  if (user.role === "superadmin") return true;

  if (user.role === "admin") {
    return !ciann.college || ciann.college === user.college;
  }

  return ciann.owner?.toString() === user._id.toString();
};

async function getScopedCiann(ciannId, user) {
  const ciann = await Ciann.findOne({ ciannId });
  if (!ciann) return { error: { status: 404, message: "CIANN not found" } };
  if (!canAccessCiann(ciann, user)) {
    return { error: { status: 403, message: "Access denied for this CIANN" } };
  }
  return { ciann };
}

async function resolveStudentFilter(ciann) {
  const filter = {};

  const departmentId = ciann?.department?._id || null;
  const semester = Number(ciann?.semester);
  const institution = ciann?.college || null;

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  let courseId = ciann?.courseId || null;
  if (!courseId && departmentId && Number.isFinite(semester)) {
    const course = await Course.findOne({
      departmentId,
      semester,
      ...(institution ? { institution } : {}),
    }).select("_id");

    if (course?._id) {
      courseId = course._id;
    }
  }

  if (courseId) {
    filter.courseId = courseId;
  }

  let divisionId = ciann?.divisionId || null;
  if (!divisionId && ciann?.division) {
    const division = await Division.findOne({
      name: ciann.division,
      ...(courseId ? { courseId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(institution ? { institution } : {}),
    }).select("_id");

    if (division?._id) {
      divisionId = division._id;
    }
  }

  if (divisionId) {
    filter.divisionId = divisionId;
  } else if (ciann?.division) {
    filter.division = ciann.division;
  }

  return filter;
}

function validateMark(value, label) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${label} must be a number`;
  }
  if (numeric < 0 || numeric > 30) {
    return `${label} must be between 0 and 30`;
  }
  return null;
}

router.get("/cianns", async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "faculty" || req.user.role === "office") {
      filter = { owner: req.user._id };
    } else if (req.user.role === "admin") {
      filter = { college: req.user.college };
    }

    const cianns = await Ciann.find(filter)
      .select("ciannId subject division class academicYear semester college")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: cianns });
  } catch (error) {
    console.error("Error fetching CT CIANN list:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch CIANN list" });
  }
});

router.get("/ciann/:ciannId/students", async (req, res) => {
  try {
    const ciannId = parseCiannId(req.params.ciannId);
    if (!ciannId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid CIANN ID format" });
    }

    const { ciann, error } = await getScopedCiann(ciannId, req.user);
    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const studentFilter = await resolveStudentFilter(ciann);

    const students = await Student.find(studentFilter)
      .select(
        "_id rollNo enrollmentNo studentName batch division divisionId departmentId courseId",
      )
      .sort({ rollNo: 1, studentName: 1 });

    const marks = await CTMarks.find({
      ciannId,
      ctNumber: { $in: [1, 2] },
    }).select("_id ctNumber marks enrollmentNo rollNo studentName studentId");

    const marksMap = new Map();

    marks.forEach((entry) => {
      const key =
        String(entry.enrollmentNo || "")
          .trim()
          .toLowerCase() ||
        String(entry.rollNo || "")
          .trim()
          .toLowerCase() ||
        String(entry.studentId || "")
          .trim()
          .toLowerCase();

      if (!key) return;

      if (!marksMap.has(key)) {
        marksMap.set(key, {});
      }

      const studentMarks = marksMap.get(key);
      if (entry.ctNumber === 1) {
        studentMarks.ct1 = entry.marks;
        studentMarks.ct1MarkId = entry._id;
      }
      if (entry.ctNumber === 2) {
        studentMarks.ct2 = entry.marks;
        studentMarks.ct2MarkId = entry._id;
      }
    });

    const data = students.map((student) => {
      const key =
        String(student.enrollmentNo || "")
          .trim()
          .toLowerCase() ||
        String(student.rollNo || "")
          .trim()
          .toLowerCase() ||
        String(student._id || "")
          .trim()
          .toLowerCase();

      const existing = marksMap.get(key) || {};
      return {
        _id: student._id,
        rollNo: student.rollNo,
        enrollmentNo: student.enrollmentNo,
        studentName: student.studentName,
        ct1: existing.ct1 ?? null,
        ct2: existing.ct2 ?? null,
        ct1MarkId: existing.ct1MarkId || null,
        ct2MarkId: existing.ct2MarkId || null,
      };
    });

    res.json({
      success: true,
      ciann: {
        ciannId: ciann.ciannId,
        subject: ciann.subject,
        department: ciann.department,
        division: ciann.division,
        class: ciann.class,
      },
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error fetching CT students/marks:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch students and CT marks",
      });
  }
});

router.post("/ciann/:ciannId/save", async (req, res) => {
  try {
    const ciannId = parseCiannId(req.params.ciannId);
    if (!ciannId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid CIANN ID format" });
    }

    if (
      req.user.role !== "faculty" &&
      req.user.role !== "office" &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Only faculty can save CT marks" });
    }

    const { ciann, error } = await getScopedCiann(ciannId, req.user);
    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const rows = Array.isArray(req.body?.marks) ? req.body.marks : [];
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Marks payload is required" });
    }

    const invalids = [];
    rows.forEach((row, index) => {
      const ct1Error = validateMark(row.ct1, `Row ${index + 1} CT-1`);
      const ct2Error = validateMark(row.ct2, `Row ${index + 1} CT-2`);
      if (ct1Error) invalids.push(ct1Error);
      if (ct2Error) invalids.push(ct2Error);
    });

    if (invalids.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed for one or more marks",
        errors: invalids,
      });
    }

    let writeCount = 0;

    for (const row of rows) {
      const studentIdentity = {
        studentId: row.studentId || row._id,
        studentName: row.studentName,
        rollNo: row.rollNo,
        enrollmentNo: row.enrollmentNo,
      };

      const baseContext = {
        ciannId,
        subject: ciann.subject?.name || row.subject || "",
        subjectCode: ciann.subject?.code || row.subjectCode || "",
        subjectId: ciann.subject?._id ? String(ciann.subject._id) : undefined,
        className: ciann.class,
        division: ciann.division,
        program: ciann.department?.name || "",
        totalMarks: 30,
        markedBy: req.user.username,
        facultyId: req.user._id,
      };

      if (row.ct1 !== null && row.ct1 !== undefined && row.ct1 !== "") {
        await CTMarks.findOneAndUpdate(
          {
            ciannId,
            ctNumber: 1,
            enrollmentNo: row.enrollmentNo,
          },
          {
            ...studentIdentity,
            ...baseContext,
            ctName: "CT-1",
            ctNumber: 1,
            marks: Number(row.ct1),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          },
        );
        writeCount += 1;
      }

      if (row.ct2 !== null && row.ct2 !== undefined && row.ct2 !== "") {
        await CTMarks.findOneAndUpdate(
          {
            ciannId,
            ctNumber: 2,
            enrollmentNo: row.enrollmentNo,
          },
          {
            ...studentIdentity,
            ...baseContext,
            ctName: "CT-2",
            ctNumber: 2,
            marks: Number(row.ct2),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          },
        );
        writeCount += 1;
      }
    }

    res.json({
      success: true,
      message: "CT marks saved/updated successfully",
      updatedEntries: writeCount,
    });
  } catch (error) {
    console.error("Error saving CT marks:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to save CT marks" });
  }
});

// Legacy endpoint retained for compatibility (e.g. K5 print)
router.get("/:ciannId/ct/:ctNumber", async (req, res) => {
  try {
    const ciannId = parseCiannId(req.params.ciannId);
    const ctNumber = parseInt(req.params.ctNumber, 10);

    if (!ciannId || ![1, 2].includes(ctNumber)) {
      return res
        .status(400)
        .json({ message: "Invalid CIANN ID or CT Number format" });
    }

    const { error } = await getScopedCiann(ciannId, req.user);
    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const ctMarks = await CTMarks.find({ ciannId, ctNumber }).sort({
      studentName: 1,
    });

    res.json({
      success: true,
      data: ctMarks,
      count: ctMarks.length,
      ctNumber,
    });
  } catch (error) {
    console.error("Error fetching CT marks for specific CT:", error);
    res.status(500).json({ message: "Server error while fetching CT marks" });
  }
});

// Legacy endpoint retained for compatibility (e.g. K5 print)
router.get("/:ciannId", async (req, res) => {
  try {
    const ciannId = parseCiannId(req.params.ciannId);

    if (!ciannId) {
      return res.status(400).json({ message: "Invalid CIANN ID format" });
    }

    const { error } = await getScopedCiann(ciannId, req.user);
    if (error) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    const ctMarks = await CTMarks.find({ ciannId }).sort({
      ctNumber: 1,
      studentName: 1,
    });

    res.json({
      success: true,
      data: ctMarks,
      count: ctMarks.length,
    });
  } catch (error) {
    console.error("Error fetching CT marks:", error);
    res.status(500).json({ message: "Server error while fetching CT marks" });
  }
});

router.get("/student-marks/:enrollmentNo", async (req, res) => {
  try {
    const enrollmentNo = String(req.params.enrollmentNo || "").trim();
    if (!enrollmentNo) {
      return res
        .status(400)
        .json({ success: false, message: "Enrollment number is required" });
    }

    if (req.user.role === "student") {
      const student = await Student.findOne({
        username: req.user.username,
      }).select("enrollmentNo");
      if (!student || String(student.enrollmentNo).trim() !== enrollmentNo) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Access denied for this student record",
          });
      }
    }

    const entries = await CTMarks.find({
      enrollmentNo,
      ctNumber: { $in: [1, 2] },
    })
      .select("ciannId subject subjectCode ctNumber marks totalMarks")
      .sort({ subject: 1, ctNumber: 1 });

    const bySubject = new Map();

    entries.forEach((entry) => {
      const key = `${entry.subjectCode || ""}::${entry.subject || ""}::${entry.ciannId}`;
      if (!bySubject.has(key)) {
        bySubject.set(key, {
          subjectName: entry.subject || "",
          subjectCode: entry.subjectCode || "",
          ciannId: entry.ciannId,
          ct1: null,
          ct2: null,
        });
      }

      const subjectEntry = bySubject.get(key);
      if (entry.ctNumber === 1) subjectEntry.ct1 = entry.marks;
      if (entry.ctNumber === 2) subjectEntry.ct2 = entry.marks;
    });

    res.json(Array.from(bySubject.values()));
  } catch (error) {
    console.error("Error fetching student CT marks:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch student CT marks" });
  }
});

module.exports = router;
