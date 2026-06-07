const express = require("express");
const mongoose = require("mongoose");
const Department = require("../models/Department");
const Course = require("../models/Course");
const Division = require("../models/Division");
const Subject = require("../models/Subject");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.use(authenticate);

router.get("/departments", async (req, res) => {
  try {
    const institution = req.user.college;
    const departments = await Department.find({ institution })
      .sort({ name: 1 })
      .select("_id name code");

    res.json({ success: true, departments });
  } catch (err) {
    console.error("Error fetching catalog departments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/courses/:departmentId", async (req, res) => {
  try {
    const { departmentId } = req.params;
    if (!isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const institution = req.user.college;
    const courses = await Course.find({ departmentId, institution })
      .sort({ semester: 1, courseCode: 1 })
      .select("_id semester scheme courseCode departmentId");

    res.json({ success: true, courses });
  } catch (err) {
    console.error("Error fetching catalog courses:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/divisions/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const institution = req.user.college;
    const divisions = await Division.find({ courseId, institution })
      .sort({ name: 1 })
      .select("_id name courseId departmentId");

    res.json({ success: true, divisions });
  } catch (err) {
    console.error("Error fetching catalog divisions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/subjects", async (req, res) => {
  try {
    const { departmentId, courseId } = req.query;
    const institution = req.user.college;

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
      .select("_id name code departmentId courseId")
      .sort({ name: 1 });

    res.json({ success: true, subjects });
  } catch (err) {
    console.error("Error fetching catalog subjects:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
