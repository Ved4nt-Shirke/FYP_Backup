const express = require("express");
const router = express.Router();
const CourseDetails = require("../models/CourseDetails");
const Subject = require("../models/Subject");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// GET /api/course-details/subject/:subjectId
// Fetch course details by subjectId
router.get("/subject/:subjectId", authenticate, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const institution = req.user.college;

    const details = await CourseDetails.findOne({ subjectId }).populate("subjectId");
    if (!details) {
      return res.status(404).json({
        success: false,
        message: "Course details not found for this subject",
      });
    }

    // Authorization check: User must belong to the same college unless superadmin
    if (req.user.role !== "superadmin" && details.institution !== institution) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Institution mismatch.",
      });
    }

    res.json({
      success: true,
      courseDetails: details,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
      error: error.message,
    });
  }
});

// GET /api/course-details/list
// List all subjects with course details in this institution (for copy feature)
router.get("/list", authenticate, async (req, res) => {
  try {
    const institution = req.user.college;
    const filter = req.user.role === "superadmin" ? {} : { institution };

    const list = await CourseDetails.find(filter)
      .populate("subjectId", "name code")
      .select("subjectId courseCode courseTitle abbreviation");

    res.json({
      success: true,
      courseDetailsList: list,
    });
  } catch (error) {
    console.error("Error listing course details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list course details",
      error: error.message,
    });
  }
});

// POST /api/course-details
// Create or Update course details for a subject (Admin only)
router.post("/", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { subjectId, ...updateData } = req.body;
    const institution = req.user.college;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required",
      });
    }

    // Verify subject exists and belongs to the admin's institution
    const subject = await Subject.findOne({ _id: subjectId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (req.user.role !== "superadmin" && subject.institution !== institution) {
      return res.status(403).json({
        success: false,
        message: "You can only edit subjects for your own institution",
      });
    }

    // Upsert behavior
    const updatedDetails = await CourseDetails.findOneAndUpdate(
      { subjectId },
      {
        ...updateData,
        subjectId,
        institution: subject.institution, // Ensure same institution
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Course details saved successfully",
      courseDetails: updatedDetails,
    });
  } catch (error) {
    console.error("Error saving course details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save course details",
      error: error.message,
    });
  }
});

module.exports = router;
