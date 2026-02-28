const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Course = require("../models/Course");
const Department = require("../models/Department");
const Subject = require("../models/Subject");
const User = require("../models/user");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateHierarchy = async ({ institution, departmentId, courseId }) => {
  if (!isValidObjectId(departmentId)) {
    return { ok: false, message: "Invalid department ID" };
  }
  if (!isValidObjectId(courseId)) {
    return { ok: false, message: "Invalid course ID" };
  }

  const department = await Department.findOne({
    _id: departmentId,
    institution,
  });
  if (!department) {
    return { ok: false, message: "Department not found" };
  }

  const course = await Course.findOne({
    _id: courseId,
    departmentId,
    institution,
  });
  if (!course) {
    return { ok: false, message: "Course not found in department" };
  }

  return { ok: true, department, course };
};

const createSubjectsBatch = async ({
  subjects,
  departmentId,
  courseId,
  institution,
  userId,
}) => {
  const results = {
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  const seenCodes = new Set();

  for (const [index, subjectRow] of subjects.entries()) {
    const rawName = subjectRow?.name;
    const rawCode = subjectRow?.code;
    const name = String(rawName || "").trim();
    const code = String(rawCode || "").trim().toUpperCase();

    if (!name || !code) {
      results.skipped += 1;
      results.errors.push({
        row: index + 1,
        code: code || "",
        error: "Subject name and code are required",
      });
      continue;
    }

    if (seenCodes.has(code)) {
      results.skipped += 1;
      results.errors.push({
        row: index + 1,
        code,
        error: "Duplicate subject code in upload file",
      });
      continue;
    }

    seenCodes.add(code);

    try {
      const existingSubject = await Subject.findOne({
        departmentId,
        code,
        institution,
      });

      if (existingSubject) {
        results.skipped += 1;
        results.errors.push({
          row: index + 1,
          code,
          error: "Subject code already exists in this department",
        });
        continue;
      }

      await Subject.create({
        name,
        code,
        departmentId,
        courseId,
        institution,
        createdBy: userId,
      });

      results.inserted += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push({
        row: index + 1,
        code,
        error: error.message || "Failed to create subject",
      });
    }
  }

  return results;
};

const createSubject = async (req, res) => {
  try {
    const { name, code, departmentId, courseId } = req.body;
    const institution = req.user.college;

    if (!name || !code || !departmentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All subject fields are required",
      });
    }

    const validation = await validateHierarchy({
      institution,
      departmentId,
      courseId,
    });

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      departmentId,
      courseId,
      institution,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      subject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Subject code already exists in this department",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create subject",
      error: error.message,
    });
  }
};

const listSubjects = async (req, res) => {
  try {
    const institution = req.user.college;
    const { departmentId, courseId, divisionId } = req.query;

    const filters = { institution };

    if (departmentId) {
      if (!isValidObjectId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }
      filters.departmentId = departmentId;
    }

    if (courseId) {
      if (!isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }
      filters.courseId = courseId;
    }

    const subjects = await Subject.find(filters)
      .populate("departmentId", "name code")
      .populate("courseId", "courseCode semester scheme")
      .sort({ name: 1 });

    res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: error.message,
    });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, departmentId, courseId } = req.body;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const existing = await Subject.findOne({ _id: id, institution });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const nextDepartmentId = departmentId || existing.departmentId.toString();
    const nextCourseId = courseId || existing.courseId.toString();

    const validation = await validateHierarchy({
      institution,
      departmentId: nextDepartmentId,
      courseId: nextCourseId,
    });

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    existing.name = name ? name.trim() : existing.name;
    existing.code = code ? code.trim().toUpperCase() : existing.code;
    existing.departmentId = nextDepartmentId;
    existing.courseId = nextCourseId;

    await existing.save();

    res.json({
      success: true,
      subject: existing,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Subject code already exists in this department",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update subject",
      error: error.message,
    });
  }
};

const bulkImportSubjects = async (req, res) => {
  try {
    const { departmentId, courseId, subjects } = req.body;
    const institution = req.user.college;

    if (!departmentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Department and course are required",
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subjects array",
      });
    }

    const validation = await validateHierarchy({
      institution,
      departmentId,
      courseId,
    });

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const results = await createSubjectsBatch({
      subjects,
      departmentId,
      courseId,
      institution,
      userId: req.user._id,
    });

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to bulk import subjects",
      error: error.message,
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findOneAndDelete({ _id: id, institution });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete subject",
      error: error.message,
    });
  }
};

const deleteAll = async (req, res) => {
  try {
    const { courseId, adminPassword } = req.body;
    const institution = req.user.college;
    const userId = req.user._id;

    if (!courseId || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: "Course ID and admin password are required",
      });
    }

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Verify the admin password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Simple password comparison (if bcrypt is used during registration, use await bcrypt.compare)
    // For now, assume plain text comparison or bcrypt
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(adminPassword, user.password);
    } catch {
      // Fallback to plain text comparison if bcrypt fails
      passwordMatch = adminPassword === user.password;
    }

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin password",
      });
    }

    // Verify course exists and belongs to institution
    const course = await Course.findOne({
      _id: courseId,
      institution,
    });

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    // Delete all subjects for this course
    const result = await Subject.deleteMany({
      courseId,
      institution,
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount || 0,
      message: `Deleted ${result.deletedCount || 0} subjects successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete subjects",
      error: error.message,
    });
  }
};

module.exports = {
  createSubject,
  bulkImportSubjects,
  listSubjects,
  updateSubject,
  deleteSubject,
  deleteAll,
};
