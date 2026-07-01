const express = require("express");
const {
  createDivision,
  listDivisionsByCourse,
  updateDivision,
  deleteDivision,
} = require("../controllers/divisionController");

const router = express.Router();

router.post("/", createDivision);
router.get("/:courseId", listDivisionsByCourse);
router.put("/:id", updateDivision);
router.delete("/:id", deleteDivision);

module.exports = router;
