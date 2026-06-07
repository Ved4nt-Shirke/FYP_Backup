// routes/practicalAttendance.js

const express = require("express");
const router = express.Router();
const PracticalAttendance = require("../models/PracticalAttendance");

// POST: Create or update practical attendance record
router.post("/", async (req, res) => {
  const {
    ciannId,
    weekNo,
    batch,
    exptNo,
    exptName,
    actualDate,
    remark,
    students,
  } = req.body;

  try {
    const filter = { ciannId, weekNo, batch, exptNo };
    const update = { exptName, actualDate, remark, students };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const result = await PracticalAttendance.findOneAndUpdate(
      filter,
      update,
      options
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error saving practical attendance:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch practical attendance records
router.get("/", async (req, res) => {
  try {
    const { ciannId } = req.query;
    
    let query = {};
    if (ciannId) {
      query.ciannId = parseInt(ciannId);
    }
    
    const records = await PracticalAttendance.find(query).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update existing practical attendance record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedRecord = await PracticalAttendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ error: "Practical attendance record not found" });
    }
    
    res.json({
      message: "Practical attendance updated successfully",
      data: updatedRecord
    });
  } catch (error) {
    console.error("Error updating practical attendance:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete practical attendance record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRecord = await PracticalAttendance.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      return res.status(404).json({ error: "Practical attendance record not found" });
    }
    
    res.json({
      message: "Practical attendance record deleted successfully",
      data: deletedRecord
    });
  } catch (error) {
    console.error("Error deleting practical attendance:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
