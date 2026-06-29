const express = require("express");
const {
  createCourse,
  listCoursesByDepartment,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");

const router = express.Router();

router.post("/", createCourse);
router.get("/:departmentId", listCoursesByDepartment);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;
