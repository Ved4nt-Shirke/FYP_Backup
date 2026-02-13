const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Notice = require("../models/Notice");

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

module.exports = router;
