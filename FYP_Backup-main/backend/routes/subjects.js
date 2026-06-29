const express = require("express");
const {
  createSubject,
  bulkImportSubjects,
  listSubjects,
  updateSubject,
  deleteSubject,
  deleteAll,
} = require("../controllers/subjectController");

const router = express.Router();

router.post("/", createSubject);
router.post("/bulk-import", bulkImportSubjects);
router.post("/delete-all", deleteAll);
router.get("/", listSubjects);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
