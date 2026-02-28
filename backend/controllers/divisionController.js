const mongoose = require("mongoose");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Subject = require("../models/Subject");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createDivision = async (req, res) => {
  try {
    const { name, courseId } = req.body;
    const institution = req.user.college;

    if (!name || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Division name and course are required",
      });
    }

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({ _id: courseId, institution });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const division = await Division.create({
      name: name.trim(),
      courseId,
      departmentId: course.departmentId,
      institution,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      division,
    });
  } catch (error) {
    if (error.code === 11000) {
      const keyPattern = error.keyPattern || {};
      const rawMessage = String(error.message || "");
      const indexMatch = rawMessage.match(/index:\s*([^\s]+)\s*dup key/i);

      if (keyPattern.name || indexMatch?.[1] === "name_1") {
        return res.status(409).json({
          success: false,
          message:
            "Legacy division index conflict detected. Run `npm run fix:catalog-indexes` in backend, then retry.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Division name already exists in this course",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create division",
      error: error.message,
    });
  }
};

const listDivisionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const institution = req.user.college;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({ _id: courseId, institution });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const divisions = await Division.find({ courseId, institution }).sort({
      name: 1,
    });

    res.json({
      success: true,
      divisions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch divisions",
      error: error.message,
    });
  }
};

const updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Division name is required",
      });
    }

    const division = await Division.findOneAndUpdate(
      { _id: id, institution },
      { name: name.trim() },
      { new: true },
    );

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Division not found",
      });
    }

    res.json({
      success: true,
      division,
    });
  } catch (error) {
    if (error.code === 11000) {
      const keyPattern = error.keyPattern || {};
      const rawMessage = String(error.message || "");
      const indexMatch = rawMessage.match(/index:\s*([^\s]+)\s*dup key/i);

      if (keyPattern.name || indexMatch?.[1] === "name_1") {
        return res.status(409).json({
          success: false,
          message:
            "Legacy division index conflict detected. Run `npm run fix:catalog-indexes` in backend, then retry.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Division name already exists in this course",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update division",
      error: error.message,
    });
  }
};

const deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = req.user.college;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID",
      });
    }

    const division = await Division.findOne({ _id: id, institution });

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Division not found",
      });
    }

    await Subject.deleteMany({ divisionId: id, institution });
    await Division.deleteOne({ _id: id, institution });

    res.json({
      success: true,
      message: "Division deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete division",
      error: error.message,
    });
  }
};

module.exports = {
  createDivision,
  listDivisionsByCourse,
  updateDivision,
  deleteDivision,
};
