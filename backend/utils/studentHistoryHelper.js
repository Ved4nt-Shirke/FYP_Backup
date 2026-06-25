const StudentAcademicHistory = require("../models/StudentAcademicHistory");
const Course = require("../models/Course");
const Student = require("../models/Student");
const Division = require("../models/Division");

/**
 * Normalizes academicYear string to a RegExp supporting optional spaces and short vs long formats.
 * E.g., "2026 - 2027" -> /^2026\s*-\s*(?:27|2027)$/i
 */
function getAcademicYearRegex(academicYear) {
  if (!academicYear) return null;
  const matches = academicYear.match(/(\d{4})\s*-\s*(\d{2,4})/);
  if (matches) {
    const startYear = matches[1];
    const endYear = matches[2];
    const shortEndYear = endYear.length === 4 ? endYear.slice(2) : endYear;
    const longEndYear = endYear.length === 2 ? (startYear.slice(0, 2) + endYear) : endYear;
    const pattern = `^${startYear}\\s*-\\s*(?:${shortEndYear}|${longEndYear})$`;
    return new RegExp(pattern, "i");
  }
  return new RegExp(`^${academicYear.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}


/**
 * Ensures that a student has an active StudentAcademicHistory record for their current academic year and semester.
 * @param {Object} student - The Student document (from master Student collection).
 */
async function ensureStudentHistory(student) {
  if (!student || !student._id || !student.courseId || !student.academicYear) {
    return null;
  }

  let divisionId = student.divisionId;
  if (!divisionId && student.division) {
    try {
      const divDoc = await Division.findOne({ 
        name: { $regex: new RegExp(`^${student.division.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        institution: student.institution 
      });
      if (divDoc) {
        divisionId = divDoc._id;
        await Student.findByIdAndUpdate(student._id, { divisionId });
      }
    } catch (err) {
      console.warn(`[StudentHistoryHelper] Failed to heal divisionId for student ${student.enrollmentNo}:`, err.message);
    }
  }

  try {
    const course = await Course.findById(student.courseId);
    if (!course) {
      console.warn(`[StudentHistoryHelper] Course not found for ID: ${student.courseId}`);
      return null;
    }

    const semester = Number(course.semester);
    if (isNaN(semester)) {
      console.warn(`[StudentHistoryHelper] Invalid semester "${course.semester}" for course ID: ${student.courseId}`);
      return null;
    }

    const historyRecord = await StudentAcademicHistory.findOneAndUpdate(
      {
        studentId: student._id,
        academicYear: student.academicYear,
        semester: semester
      },
      {
        studentId: student._id,
        academicYear: student.academicYear,
        semester: semester,
        divisionId: divisionId,
        rollNo: student.rollNo,
        seatNo: student.seatNo || "",
        status: "active"
      },
      { upsert: true, new: true }
    );
    return historyRecord;
  } catch (err) {
    console.error(`[StudentHistoryHelper] Error ensuring history for student ID: ${student._id}:`, err.message);
    throw err;
  }
}

/**
 * Backfills StudentAcademicHistory for all students in the database.
 */
async function backfillAllStudentsHistory() {
  console.log("[StudentHistoryHelper] Starting StudentAcademicHistory backfill process...");
  try {
    const students = await Student.find({});
    console.log(`[StudentHistoryHelper] Found ${students.length} students to check/backfill.`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const student of students) {
      try {
        await ensureStudentHistory(student);
        successCount++;
      } catch (err) {
        failCount++;
      }
    }
    
    console.log(`[StudentHistoryHelper] Backfill completed. Success: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error("[StudentHistoryHelper] Critical error during backfill:", err);
  }
}

/**
 * Resolves the student list for a given set of parameters.
 * First queries StudentAcademicHistory if academicYear or divisionId/division is specified.
 * Falls back to querying the master Student table if no records found.
 */
async function resolveStudents(params, college) {
  const { batch, division, divisionId, courseId, departmentId, academicYear, semester } = params;
  let useHistory = false;
  let historyQuery = {};

  if (academicYear) {
    const ayRegex = getAcademicYearRegex(academicYear);
    if (ayRegex) {
      historyQuery.academicYear = ayRegex;
    } else {
      historyQuery.academicYear = academicYear;
    }
    useHistory = true;
  }
  if (semester) {
    historyQuery.semester = Number(semester);
    useHistory = true;
  }
  if (divisionId) {
    historyQuery.divisionId = divisionId;
    if (!academicYear && !semester) {
      historyQuery.status = "active";
    }
    useHistory = true;
  } else if (division) {
    const foundDivs = await Division.find({ 
      name: { $regex: new RegExp(`^${division.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      institution: { $regex: new RegExp("^" + String(college || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") }
    });
    if (foundDivs.length > 0) {
      historyQuery.divisionId = { $in: foundDivs.map(d => d._id) };
      if (!academicYear && !semester) {
        historyQuery.status = "active";
      }
      useHistory = true;
    }
  }

  let students = [];
  if (useHistory) {
    const historyRecords = await StudentAcademicHistory.find(historyQuery)
      .populate({
        path: "studentId",
        populate: [
          { path: "departmentId", select: "name code" },
          { path: "courseId", select: "name semester class scheme courseCode" }
        ]
      })
      .populate("divisionId", "name")
      .lean()
      .exec();

    if (historyRecords.length > 0) {
      students = historyRecords
        .filter(rec => {
          const s = rec.studentId;
          if (!s) return false;
          if (String(s.institution || "").trim().toUpperCase() !== String(college || "").trim().toUpperCase()) return false;
          if (batch && s.batch !== batch) return false;
          if (departmentId && String(s.departmentId?._id || s.departmentId) !== String(departmentId)) return false;
          if (courseId && String(s.courseId?._id || s.courseId) !== String(courseId)) return false;
          if (division && String(rec.divisionId?.name || s.division).trim().toLowerCase() !== String(division).trim().toLowerCase()) return false;
          return true;
        })
        .map(rec => {
          const s = rec.studentId;
          return {
            _id: s._id,
            rollNo: rec.rollNo || s.rollNo,
            enrollmentNo: s.enrollmentNo,
            studentName: s.studentName,
            batch: s.batch,
            academicYear: rec.academicYear || s.academicYear,
            division: rec.divisionId?.name || s.division,
            divisionId: rec.divisionId?._id || s.divisionId,
            departmentId: s.departmentId?._id || s.departmentId,
            courseId: s.courseId?._id || s.courseId,
            seatNo: rec.seatNo || s.seatNo || "",
            username: s.username,
            plainPassword: s.plainPassword,
            aadhaarNo: s.aadhaarNo,
            departmentName: s.departmentId?.name || "",
            departmentCode: s.departmentId?.code || "",
            courseName: s.courseId?.name || "",
            semester: s.courseId?.semester || "",
            className: s.courseId?.class || "",
            divisionName: rec.divisionId?.name || s.division,
          };
        });
    }
  }

  if (students.length === 0) {
    // Fallback to querying master Student table
    const query = { institution: { $regex: new RegExp("^" + String(college || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } };
    if (batch) query.batch = batch;
    if (divisionId) {
      query.divisionId = divisionId;
    } else if (division) {
      query.division = division;
    }
    if (courseId) {
      query.courseId = courseId;
    } else if (semester) {
      const semNum = Number(semester);
      const semFilter = !isNaN(semNum) ? { $in: [semNum, String(semester)] } : String(semester);
      const courses = await Course.find({ semester: semFilter });
      if (courses.length > 0) {
        query.courseId = { $in: courses.map(c => c._id) };
      } else {
        query.courseId = { $in: [] }; // Return no students if no courses match the semester
      }
    }
    if (departmentId) query.departmentId = departmentId;
    if (academicYear) {
      const ayRegex = getAcademicYearRegex(academicYear);
      if (ayRegex) {
        query.academicYear = ayRegex;
      } else {
        query.academicYear = academicYear;
      }
    }

    const dbStudents = await Student.find(query)
      .populate("departmentId", "name code")
      .populate("courseId", "name semester class scheme courseCode")
      .populate("divisionId", "name")
      .select("rollNo studentName enrollmentNo batch academicYear division departmentId courseId divisionId seatNo plainPassword username aadhaarNo")
      .lean()
      .exec();

    students = dbStudents.map(s => ({
      ...s,
      departmentName: s.departmentId?.name || "",
      departmentCode: s.departmentId?.code || "",
      courseName: s.courseId?.name || "",
      semester: s.courseId?.semester || "",
      className: s.courseId?.class || "",
      divisionName: s.divisionId?.name || s.division,
    }));
  }

  // Sort students naturally by roll number
  students.sort((a, b) => {
    const aRoll = String(a.rollNo || "");
    const bRoll = String(b.rollNo || "");
    return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
  });

  return students;
}

module.exports = {
  ensureStudentHistory,
  backfillAllStudentsHistory,
  resolveStudents
};
