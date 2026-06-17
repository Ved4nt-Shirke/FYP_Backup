const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Notice = require("../models/Notice");
const Faculty = require("../models/Faculty");

// Middleware to authenticate all notice routes
router.use(authenticate);

// Get all notices for a faculty
router.get("/notices", async (req, res) => {
  try {
    const { faculty } = req.query;
    const college = req.user.college;

    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: "Faculty parameter is required",
      });
    }

    const notices = await Notice.find({ faculty, college }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notices",
      error: error.message,
    });
  }
});

// Create a new notice
router.post("/notices", async (req, res) => {
  try {
    const { title, content, faculty } = req.body;
    const college = req.user.college;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const newNotice = new Notice({
      title,
      content,
      faculty,
      source: "faculty",
      college,
    });

    await newNotice.save();

    res.json({
      success: true,
      notice: newNotice,
      message: "Notice created successfully",
    });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notice",
      error: error.message,
    });
  }
});

// Update a notice
router.put("/notices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const college = req.user.college;

    const notice = await Notice.findOne({ _id: id, college });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (!notice.source) notice.source = "faculty";
    notice.updatedAt = new Date();

    await notice.save();

    res.json({
      success: true,
      notice,
      message: "Notice updated successfully",
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notice",
      error: error.message,
    });
  }
});

// Delete a notice
router.delete("/notices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const college = req.user.college;

    const notice = await Notice.findOneAndDelete({ _id: id, college });

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    res.json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notice",
      error: error.message,
    });
  }
});

// Get directory of active faculty members in same institution
router.get("/directory", async (req, res) => {
  try {
    const college = (req.user.college || "").trim();
    const { search, department } = req.query;

    let query = { 
      institution: { $regex: new RegExp("^" + college + "$", "i") }, 
      status: "active" 
    };

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { generatedUsername: { $regex: search, $options: "i" } }
      ];
    }

    // Don't show current user in search results to avoid sharing with self
    query.generatedUsername = { $ne: req.user.username };

    const facultyList = await Faculty.find(query)
      .populate("department", "name code")
      .select("fullName email employeeId generatedUsername department")
      .sort({ fullName: 1 })
      .limit(50);

    res.json({ success: true, faculty: facultyList });
  } catch (error) {
    console.error("Error fetching faculty directory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
