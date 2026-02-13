const express = require("express");
const router = express.Router();
const Experiment = require("../models/Experiment"); // Schema file

// Get experiments by Program/Class/Course with flexible fallback
router.post("/get-experiments", async (req, res) => {
  const { program, className, course } = req.body;
  try {
    // Exact match first
    let result = await Experiment.findOne({ program, className, course });

    if (!result) {
      // Strict fallback: anchored, case-insensitive AND match to avoid cross-subject mixing
      const p = (program || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const c = (className || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const s = (course || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = await Experiment.findOne({
        program: { $regex: `^${p}$`, $options: 'i' },
        className: { $regex: `^${c}$`, $options: 'i' },
        course: { $regex: `^${s}$`, $options: 'i' },
      });
    }

    // Fallback: match by Program + Course (ignore className), anchored & case-insensitive
    if (!result) {
      const p = (program || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const s = (course || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = await Experiment.findOne({
        program: { $regex: `^${p}$`, $options: 'i' },
        course: { $regex: `^${s}$`, $options: 'i' },
      });
    }

    return res.json({
      success: true,
      experiments: result ? result.experiments : [],
      message: result ? "OK" : "No exact match; flexible search may have been used or no data found",
    });
  } catch (err) {
    console.error("Error fetching experiments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ --- NEW ROUTE TO ADD AN EXPERIMENT --- ✅
router.post("/add-experiment", async (req, res) => {
  const { program, className, course, practicalNo, practicalName } = req.body;

  // Basic validation
  if (!program || !className || !course || !practicalNo || !practicalName) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  // ✅ --- FIX: Convert practicalNo to a number --- ✅
  const parsedPracticalNo = parseInt(practicalNo, 10);
  if (isNaN(parsedPracticalNo)) {
    return res.status(400).json({ success: false, message: "Practical Number must be a valid number." });
  }

  try {
    const newExperiment = {
      practicalNo: parsedPracticalNo, // Use the parsed number
      practicalName
    };

    const updatedDocument = await Experiment.findOneAndUpdate(
      { program, className, course },
      { $push: { experiments: newExperiment } },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: "Experiment added successfully.",
      data: updatedDocument,
    });
  } catch (err) {
    console.error("Error adding experiment:", err);
    res.status(500).json({ success: false, message: "Server error while adding experiment." });
  }
});

router.put("/update-experiment", async (req, res) => {
  const {
    program,
    className,
    course,
    originalPracticalNo, // We need the original number to find the practical
    practicalNo,         // The potentially new number
    practicalName,       // The new name
  } = req.body;

  // --- Data Validation ---
  if (!program || !className || !course || !originalPracticalNo || !practicalNo || !practicalName) {
    return res.status(400).json({ success: false, message: "Missing required fields for update." });
  }

  const parsedNewNo = parseInt(practicalNo, 10);
  if (isNaN(parsedNewNo)) {
    return res.status(400).json({ success: false, message: "Practical Number must be a valid number." });
  }

  try {
    const result = await Experiment.findOneAndUpdate(
      // --- Filter Criteria ---
      {
        program,
        className,
        course,
        "experiments.practicalNo": originalPracticalNo, // Find the parent doc and match the practical in the array
      },
      // --- Update Operation ---
      {
        $set: {
          "experiments.$.practicalNo": parsedNewNo,       // Update the 'practicalNo' of the matched array element
          "experiments.$.practicalName": practicalName, // Update the 'practicalName' of the matched array element
        },
      },
      // --- Options ---
      {
        new: true, // Return the modified document
      }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "Practical not found to update." });
    }

    res.json({ success: true, message: "Practical updated successfully.", data: result });

  } catch (err) {
    console.error("Error updating experiment:", err);
    res.status(500).json({ success: false, message: "Server error while updating." });
  }
});

module.exports = router;