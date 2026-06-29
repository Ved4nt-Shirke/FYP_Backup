const mongoose = require("mongoose");
const Course = require("../models/Course");
const Department = require("../models/Department");
const Division = require("../models/Division");
const Subject = require("../models/Subject");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildCourseCode = (departmentCode, semester, scheme) =>
  `${departmentCode}${semester}${scheme}`.toUpperCase();

const normalizeScheme = (scheme) =>
  String(scheme || "")
    .trim()
    .toUpperCase();

const buildDuplicateCourseMessage = (error) => {
  const keyPattern = error?.keyPattern || {};
  const keyValue = error?.keyValue || {};
  const rawMessage = String(error?.message || "");

  if (keyPattern.courseCode) {
    const conflictingCode = keyValue.courseCode;
    return conflictingCode
      ? `Course already exists with code ${conflictingCode} in this institution`
      : "Course already exists for the selected department, semester, and scheme";
  }

  if (keyPattern.name || keyPattern.courseName) {
    return "Legacy course index conflict detected. Run `npm run fix:course-indexes` in backend, then retry.";
  }

  const indexMatch = rawMessage.match(/index:\s*([^\s]+)\s*dup key/i);
  if (indexMatch?.[1]) {
    if (indexMatch[1] === "courseId_1") {
      return "Legacy index conflict detected on courses.courseId. Run `npm run fix:course-indexes` in backend, then retry.";
    }
    return `Duplicate value violates unique index ${indexMatch[1]}`;
  }

  if (/courseCode/i.test(rawMessage)) {
    return "Course already exists for the selected department, semester, and scheme";
  }

  return "Duplicate course entry detected";
};

const createCourse = async (req, res) => {
  try {
    const { departmentId, semester, scheme } = req.body;
    const institution = req.user.college;

    if (!departmentId || !semester || !scheme) {
      return res.status(400).json({
        success: false,
        message: "Department, semester, and scheme are required",
      });
    }

    if (!isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findOne({
      _id: departmentId,
      institution,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const semesterNumber = Number(semester);
    if (
      Number.isNaN(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester must be between 1 and 8",
      });
    }

    const normalizedScheme = normalizeScheme(scheme);
    if (!normalizedScheme) {
      return res.status(400).json({
        success: false,
        message: "Scheme is required",
      });
    }

    const courseCode = buildCourseCode(
      department.code,
      semesterNumber,
      normalizedScheme,
    );

    const existingCourse = await Course.findOne({
      institution,
      courseCode,
    }).select("_id departmentId semester scheme courseCode institution");

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: `Course already exists for this department, semester, and scheme (${courseCode})`,
        duplicateKey: {
          institution,
          courseCode,
        },
        existingCourse,
      });
    }

    const course = await Course.create({
      departmentId,
      semester: semesterNumber,
      scheme: normalizedScheme,
      courseCode,
      institution,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: buildDuplicateCourseMessage(error),
        duplicateKey: error.keyPattern || error.keyValue || undefined,
        errorCode: error.code,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

const listCoursesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const institution = req.user.college;

    if (!isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findOne({
      _id: departmentId,
      institution,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const courses = await Course.find({ departmentId, institution }).sort({
      courseCode: 1,
    });

    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester, scheme } = req.body;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!semester || !scheme) {
      return res.status(400).json({
        success: false,
        message: "Semester and scheme are required",
      });
    }

    const semesterNumber = Number(semester);
    if (
      Number.isNaN(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester must be between 1 and 8",
      });
    }

    const normalizedScheme = normalizeScheme(scheme);
    if (!normalizedScheme) {
      return res.status(400).json({
        success: false,
        message: "Scheme is required",
      });
    }

    const existingCourse = await Course.findOne({ _id: id, institution });
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const department = await Department.findOne({
      _id: existingCourse.departmentId,
      institution,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const courseCode = buildCourseCode(
      department.code,
      semesterNumber,
      normalizedScheme,
    );

    const course = await Course.findOneAndUpdate(
      { _id: id, institution },
      {
        semester: semesterNumber,
        scheme: normalizedScheme,
        courseCode,
      },
      { new: true },
    );

    res.json({
      success: true,
      course,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Course code already exists in this institution",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update course",
      error: error.message,
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({ _id: id, institution });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await Division.deleteMany({ courseId: id, institution });
    await Subject.deleteMany({ courseId: id, institution });
    await Course.deleteOne({ _id: id, institution });

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: error.message,
    });
  }
};

module.exports = {
  createCourse,
  listCoursesByDepartment,
  updateCourse,
  deleteCourse,
};
