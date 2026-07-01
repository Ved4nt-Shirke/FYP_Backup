// routes/subjectDetails.js

const express = require("express");
const router = express.Router();
const BookResource = require("../models/BookResource");
const CourseOutcome = require("../models/CourseOutcome");
const MoocCourse = require("../models/MoocCourse");
const SubjectObjective = require("../models/SubjectObjective");
const WebResource = require("../models/WebResource");
const KnowledgeMap = require("../models/KnowledgeMap");
const CiaanSubjectDetails = require("../models/CiannSubjectDetails");
const Ciaan = require("../models/Ciann");
const CourseDetails = require("../models/CourseDetails");
const { authenticate } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Drop old indexes to migrate schemas cleanly
const dropOldIndexes = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mongoose.connection.once("open", dropOldIndexes);
      return;
    }
    const db = mongoose.connection.db;
    await db.collection("Ciaansubjectdetails").dropIndex("CiaanId_1").catch(() => { });
    await db.collection("tlollos").dropIndex("facultyId_1_CiaanId_1_subjectId_1").catch(() => { });
  } catch (err) {
    console.warn("Index drop ignored:", err.message);
  }
};
dropOldIndexes();

// ==================== BOOK RESOURCES ====================

// Get all book resources for a Ciaan
router.get("/book-resources/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const bookResources = await BookResource.find({ CiaanId: parseInt(CiaanId) }).sort({ createdAt: -1 });
    res.json(bookResources);
  } catch (error) {
    console.error("Error fetching book resources:", error);
    res.status(500).json({ error: "Failed to fetch book resources" });
  }
});

// Create a new book resource
router.post("/book-resources", async (req, res) => {
  try {
    const bookResource = new BookResource(req.body);
    const savedResource = await bookResource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    console.error("Error creating book resource:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update a book resource
router.put("/book-resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedResource = await BookResource.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedResource) {
      return res.status(404).json({ error: "Book resource not found" });
    }
    res.json(updatedResource);
  } catch (error) {
    console.error("Error updating book resource:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a book resource
router.delete("/book-resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResource = await BookResource.findByIdAndDelete(id);
    if (!deletedResource) {
      return res.status(404).json({ error: "Book resource not found" });
    }
    res.json({ message: "Book resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting book resource:", error);
    res.status(500).json({ error: "Failed to delete book resource" });
  }
});

// ==================== COURSE OUTCOMES ====================

// Get all course outcomes for a Ciaan
router.get("/course-outcomes/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const courseOutcomes = await CourseOutcome.find({ CiaanId: parseInt(CiaanId) }).sort({ outcomeNumber: 1 });
    res.json(courseOutcomes);
  } catch (error) {
    console.error("Error fetching course outcomes:", error);
    res.status(500).json({ error: "Failed to fetch course outcomes" });
  }
});

// Create or update course outcomes (bulk operation)
router.post("/course-outcomes", async (req, res) => {
  try {
    const { CiaanId, outcomes } = req.body;

    // Delete existing outcomes for this Ciaan
    await CourseOutcome.deleteMany({ CiaanId: parseInt(CiaanId) });

    // Create new outcomes
    const courseOutcomes = outcomes.map((outcome, index) => ({
      CiaanId: parseInt(CiaanId),
      outcomeNumber: `CO${index + 1}`,
      description: outcome,
      isActive: true
    }));

    const savedOutcomes = await CourseOutcome.insertMany(courseOutcomes);
    res.status(201).json(savedOutcomes);
  } catch (error) {
    console.error("Error saving course outcomes:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update a single course outcome
router.put("/course-outcomes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOutcome = await CourseOutcome.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedOutcome) {
      return res.status(404).json({ error: "Course outcome not found" });
    }
    res.json(updatedOutcome);
  } catch (error) {
    console.error("Error updating course outcome:", error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== MOOC COURSES ====================

// Get all MOOC courses for a Ciaan
router.get("/mooc-courses/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const moocCourses = await MoocCourse.find({ CiaanId: parseInt(CiaanId) }).sort({ createdAt: -1 });
    res.json(moocCourses);
  } catch (error) {
    console.error("Error fetching MOOC courses:", error);
    res.status(500).json({ error: "Failed to fetch MOOC courses" });
  }
});

// Create or update MOOC courses (bulk operation)
router.post("/mooc-courses", async (req, res) => {
  try {
    const { CiaanId, courses } = req.body;

    // Delete existing MOOC courses for this Ciaan
    await MoocCourse.deleteMany({ CiaanId: parseInt(CiaanId) });

    // Create new MOOC courses
    const moocCourses = courses.map(course => ({
      CiaanId: parseInt(CiaanId),
      ...course
    }));

    const savedCourses = await MoocCourse.insertMany(moocCourses);
    res.status(201).json(savedCourses);
  } catch (error) {
    console.error("Error saving MOOC courses:", error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== SUBJECT OBJECTIVES ====================

// Get all subject objectives for a Ciaan
router.get("/objectives/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const objectives = await SubjectObjective.find({ CiaanId: parseInt(CiaanId) }).sort({ objectiveNumber: 1 });
    res.json(objectives);
  } catch (error) {
    console.error("Error fetching subject objectives:", error);
    res.status(500).json({ error: "Failed to fetch subject objectives" });
  }
});

// Create or update subject objectives (bulk operation)
router.post("/objectives", async (req, res) => {
  try {
    const { CiaanId, objectives } = req.body;

    // Delete existing objectives for this Ciaan
    await SubjectObjective.deleteMany({ CiaanId: parseInt(CiaanId) });

    // Create new objectives
    const subjectObjectives = objectives.map((objective, index) => ({
      CiaanId: parseInt(CiaanId),
      objectiveNumber: `OBJ${index + 1}`,
      description: objective,
      isActive: true
    }));

    const savedObjectives = await SubjectObjective.insertMany(subjectObjectives);
    res.status(201).json(savedObjectives);
  } catch (error) {
    console.error("Error saving subject objectives:", error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== WEB RESOURCES ====================

// Get all web resources for a Ciaan
router.get("/web-resources/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const webResources = await WebResource.find({ CiaanId: parseInt(CiaanId) }).sort({ createdAt: -1 });
    res.json(webResources);
  } catch (error) {
    console.error("Error fetching web resources:", error);
    res.status(500).json({ error: "Failed to fetch web resources" });
  }
});

// Create a new web resource
router.post("/web-resources", async (req, res) => {
  try {
    const webResource = new WebResource(req.body);
    const savedResource = await webResource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    console.error("Error creating web resource:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update a web resource
router.put("/web-resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedResource = await WebResource.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedResource) {
      return res.status(404).json({ error: "Web resource not found" });
    }
    res.json(updatedResource);
  } catch (error) {
    console.error("Error updating web resource:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a web resource
router.delete("/web-resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResource = await WebResource.findByIdAndDelete(id);
    if (!deletedResource) {
      return res.status(404).json({ error: "Web resource not found" });
    }
    res.json({ message: "Web resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting web resource:", error);
    res.status(500).json({ error: "Failed to delete web resource" });
  }
});

// ==================== KNOWLEDGE MAP ====================

// Get knowledge map for a Ciaan
router.get("/knowledge-map/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const knowledgeMap = await KnowledgeMap.find({ CiaanId: parseInt(CiaanId) }).sort({ moduleNumber: 1 });
    res.json(knowledgeMap);
  } catch (error) {
    console.error("Error fetching knowledge map:", error);
    res.status(500).json({ error: "Failed to fetch knowledge map" });
  }
});

// Create or update knowledge map
router.post("/knowledge-map", async (req, res) => {
  try {
    const knowledgeMap = new KnowledgeMap(req.body);
    const savedMap = await knowledgeMap.save();
    res.status(201).json(savedMap);
  } catch (error) {
    console.error("Error creating knowledge map:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update knowledge map
router.put("/knowledge-map/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMap = await KnowledgeMap.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedMap) {
      return res.status(404).json({ error: "Knowledge map not found" });
    }
    res.json(updatedMap);
  } catch (error) {
    console.error("Error updating knowledge map:", error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== Ciaan SUBJECT DETAILS ====================

const getSubjectIdByCiaanId = async (CiaanId) => {
  const CiaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
  return CiaanDoc ? (CiaanDoc.subject?._id || CiaanDoc.subjectId) : null;
};

// Get all details for a Ciaan
router.get("/Ciaan/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const subjectId = await getSubjectIdByCiaanId(CiaanId);
    if (!subjectId) {
      return res.status(404).json({ error: "Ciaan or associated subject not found" });
    }

    let details = await CiaanSubjectDetails.findOne({ subjectId });
    if (!details) {
      // Fallback: check if there's an old one by CiaanId
      details = await CiaanSubjectDetails.findOne({ CiaanId: parseInt(CiaanId) });
      if (details) {
        details.subjectId = subjectId;
        await details.save();
      } else {
        details = new CiaanSubjectDetails({ CiaanId: parseInt(CiaanId), subjectId });
        await details.save();
      }
    }
    res.json(details);
  } catch (error) {
    console.error("Error fetching CiaanSubjectDetails:", error);
    res.status(500).json({ error: "Failed to fetch Ciaan Subject Details" });
  }
});

// Update specific fields of Ciaan subject details
router.post("/Ciaan/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const updateData = req.body;
    const subjectId = await getSubjectIdByCiaanId(CiaanId);
    if (!subjectId) {
      return res.status(404).json({ error: "Ciaan or associated subject not found" });
    }

    // Find and update or insert if not exists
    const updatedDetails = await CiaanSubjectDetails.findOneAndUpdate(
      { subjectId },
      { $set: { ...updateData, subjectId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updatedDetails);
  } catch (error) {
    console.error("Error updating CiaanSubjectDetails:", error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== TLO & LLO DETAILS ====================
const TloLlo = require("../models/TloLlo");

// GET: Fetch TloLlo details
router.get("/tlo-llo/:CiaanId/:subjectId", authenticate, async (req, res) => {
  try {
    const { CiaanId, subjectId } = req.params;

    // Find record by subjectId so anyone with access can view the TLOs/LLOs
    const record = await TloLlo.findOne({
      subjectId
    });

    res.json({
      success: true,
      data: record || null
    });
  } catch (error) {
    console.error("Error fetching TloLlo:", error);
    res.status(500).json({ success: false, error: "Failed to fetch TloLlo data" });
  }
});

// POST: Save/Update TloLlo details
router.post("/tlo-llo", authenticate, async (req, res) => {
  try {
    const { CiaanId, subjectId, coData } = req.body;
    const facultyId = req.user._id;

    if (!CiaanId || !subjectId || !coData) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Find and update based on subjectId so we keep one master record per Subject
    const updatedRecord = await TloLlo.findOneAndUpdate(
      { subjectId },
      { coData, facultyId, CiaanId: parseInt(CiaanId) }, // Save/update the facultyId of the user who last edited, and CiaanId
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "TLO & LLO saved successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error saving TloLlo:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== Ciaan UNIFIED SUBJECT DETAILS ====================

// Configure multer for knowledge map image uploads
const kmUploadDir = path.join(__dirname, "../uploads/knowledge-maps");
if (!fs.existsSync(kmUploadDir)) {
  fs.mkdirSync(kmUploadDir, { recursive: true });
}

const kmStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/knowledge-maps/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "km-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const kmUpload = multer({ storage: kmStorage });

// GET: Fetch Ciaan unified subject details + admin details
router.get("/Ciaan-subject-details/:CiaanId", authenticate, async (req, res) => {
  try {
    const { CiaanId } = req.params;

    // Find the associated Ciaan
    const CiaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
    if (!CiaanDoc) {
      return res.status(404).json({ success: false, error: "Ciaan workbook not found" });
    }

    const subjectId = CiaanDoc.subject?._id || CiaanDoc.subjectId;
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Subject ID not found on Ciaan" });
    }

    // Find the faculty worksheet details by subjectId
    let details = await CiaanSubjectDetails.findOne({ subjectId });
    if (!details) {
      // Fallback: check if there's an old one by CiaanId
      details = await CiaanSubjectDetails.findOne({ CiaanId: Number(CiaanId) });
      if (details) {
        details.subjectId = subjectId;
        await details.save();
      } else {
        details = new CiaanSubjectDetails({ CiaanId: Number(CiaanId), subjectId });
        await details.save();
      }
    }

    // Find the Admin-defined CourseDetails for the subject
    let adminDetails = await CourseDetails.findOne({ subjectId }).populate("subjectId");

    res.json({
      success: true,
      details: details,
      adminDetails
    });
  } catch (error) {
    console.error("Error fetching unified subject details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subject details" });
  }
});

// POST: Save/Update Ciaan unified subject details
router.post("/Ciaan-subject-details", authenticate, async (req, res) => {
  try {
    const { CiaanId } = req.body;
    if (!CiaanId) {
      return res.status(400).json({ success: false, error: "CiaanId is required" });
    }

    const CiaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
    if (!CiaanDoc) {
      return res.status(404).json({ success: false, error: "Ciaan workbook not found" });
    }

    const subjectId = CiaanDoc.subject?._id || CiaanDoc.subjectId;
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Subject ID not found on Ciaan" });
    }

    const updatedDetails = await CiaanSubjectDetails.findOneAndUpdate(
      { subjectId },
      { ...req.body, subjectId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Subject details saved successfully",
      details: updatedDetails
    });
  } catch (error) {
    console.error("Error saving unified subject details:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET: Fetch Syllabus images for a Ciaan/Subject
router.get("/syllabus/:CiaanId", authenticate, async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const CiaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
    if (!CiaanDoc) {
      return res.status(404).json({ success: false, error: "Ciaan workbook not found" });
    }
    const subjectId = CiaanDoc.subject?._id || CiaanDoc.subjectId;
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Subject ID not found on Ciaan" });
    }

    let details = await CiaanSubjectDetails.findOne({ subjectId });
    res.json({
      success: true,
      images: details?.syllabusImages || []
    });
  } catch (error) {
    console.error("Error fetching syllabus images:", error);
    res.status(500).json({ success: false, error: "Failed to fetch syllabus images" });
  }
});

// POST: Save Syllabus images for a Ciaan/Subject
router.post("/syllabus", authenticate, async (req, res) => {
  try {
    const { CiaanId, images } = req.body;
    if (!CiaanId) {
      return res.status(400).json({ success: false, error: "CiaanId is required" });
    }
    const CiaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
    if (!CiaanDoc) {
      return res.status(404).json({ success: false, error: "Ciaan workbook not found" });
    }
    const subjectId = CiaanDoc.subject?._id || CiaanDoc.subjectId;
    if (!subjectId) {
      return res.status(400).json({ success: false, error: "Subject ID not found on Ciaan" });
    }

    const updatedDetails = await CiaanSubjectDetails.findOneAndUpdate(
      { subjectId },
      { syllabusImages: images },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Syllabus saved successfully",
      images: updatedDetails.syllabusImages
    });
  } catch (error) {
    console.error("Error saving syllabus images:", error);
    res.status(500).json({ success: false, error: "Failed to save syllabus images" });
  }
});

// POST: Upload Knowledge Map Image
router.post("/Ciaan-subject-details/knowledge-map-image", authenticate, kmUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    const imagePath = `/uploads/knowledge-maps/${req.file.filename}`;
    res.json({ success: true, imagePath });
  } catch (error) {
    console.error("Error uploading knowledge map image:", error);
    res.status(500).json({ success: false, error: "Failed to upload image" });
  }
});

module.exports = router;