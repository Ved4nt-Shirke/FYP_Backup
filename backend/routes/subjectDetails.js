// routes/subjectDetails.js

const express = require("express");
const router = express.Router();
const BookResource = require("../models/BookResource");
const CourseOutcome = require("../models/CourseOutcome");
const MoocCourse = require("../models/MoocCourse");
const SubjectObjective = require("../models/SubjectObjective");
const WebResource = require("../models/WebResource");
const KnowledgeMap = require("../models/KnowledgeMap");

// ==================== BOOK RESOURCES ====================

// Get all book resources for a CIANN
router.get("/book-resources/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const bookResources = await BookResource.find({ ciannId: parseInt(ciannId) }).sort({ createdAt: -1 });
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

// Get all course outcomes for a CIANN
router.get("/course-outcomes/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const courseOutcomes = await CourseOutcome.find({ ciannId: parseInt(ciannId) }).sort({ outcomeNumber: 1 });
    res.json(courseOutcomes);
  } catch (error) {
    console.error("Error fetching course outcomes:", error);
    res.status(500).json({ error: "Failed to fetch course outcomes" });
  }
});

// Create or update course outcomes (bulk operation)
router.post("/course-outcomes", async (req, res) => {
  try {
    const { ciannId, outcomes } = req.body;
    
    // Delete existing outcomes for this CIANN
    await CourseOutcome.deleteMany({ ciannId: parseInt(ciannId) });
    
    // Create new outcomes
    const courseOutcomes = outcomes.map((outcome, index) => ({
      ciannId: parseInt(ciannId),
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

// Get all MOOC courses for a CIANN
router.get("/mooc-courses/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const moocCourses = await MoocCourse.find({ ciannId: parseInt(ciannId) }).sort({ createdAt: -1 });
    res.json(moocCourses);
  } catch (error) {
    console.error("Error fetching MOOC courses:", error);
    res.status(500).json({ error: "Failed to fetch MOOC courses" });
  }
});

// Create or update MOOC courses (bulk operation)
router.post("/mooc-courses", async (req, res) => {
  try {
    const { ciannId, courses } = req.body;
    
    // Delete existing MOOC courses for this CIANN
    await MoocCourse.deleteMany({ ciannId: parseInt(ciannId) });
    
    // Create new MOOC courses
    const moocCourses = courses.map(course => ({
      ciannId: parseInt(ciannId),
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

// Get all subject objectives for a CIANN
router.get("/objectives/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const objectives = await SubjectObjective.find({ ciannId: parseInt(ciannId) }).sort({ objectiveNumber: 1 });
    res.json(objectives);
  } catch (error) {
    console.error("Error fetching subject objectives:", error);
    res.status(500).json({ error: "Failed to fetch subject objectives" });
  }
});

// Create or update subject objectives (bulk operation)
router.post("/objectives", async (req, res) => {
  try {
    const { ciannId, objectives } = req.body;
    
    // Delete existing objectives for this CIANN
    await SubjectObjective.deleteMany({ ciannId: parseInt(ciannId) });
    
    // Create new objectives
    const subjectObjectives = objectives.map((objective, index) => ({
      ciannId: parseInt(ciannId),
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

// Get all web resources for a CIANN
router.get("/web-resources/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const webResources = await WebResource.find({ ciannId: parseInt(ciannId) }).sort({ createdAt: -1 });
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

// Get knowledge map for a CIANN
router.get("/knowledge-map/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const knowledgeMap = await KnowledgeMap.find({ ciannId: parseInt(ciannId) }).sort({ moduleNumber: 1 });
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

module.exports = router;