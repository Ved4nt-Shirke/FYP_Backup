const express = require("express");
const router = express.Router();
const ExtraAttendance = require("../models/ExtraAttendance");

// Create topic + date (initial form)
router.post("/", async (req, res) => {
  const { topic, date, CiaanId } = req.body;
  try {
    const newDoc = new ExtraAttendance({ topic, date, CiaanId, students: [] });
    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark or update a student's attendance (checkbox page)
router.patch("/:id/mark", async (req, res) => {
  const { id } = req.params;
  const { rollId, name, present } = req.body;

  try {
    const doc = await ExtraAttendance.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const existing = doc.students.find((s) => s.rollId === rollId);
    const attendanceValue = present ? "Present" : "Absent";
    if (existing) {
      existing.attendance = attendanceValue;
    } else {
      doc.students.push({ rollId, name, attendance: attendanceValue });
    }

    await doc.save();
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get all extra attendance records by CiaanId (MUST come before /:id route)
router.get('/Ciaan/:CiaanId', async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const records = await ExtraAttendance.find({ CiaanId: parseInt(CiaanId) });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get extra attendance record by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await ExtraAttendance.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update extra attendance record by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, date, students, CiaanId } = req.body;

    const updateData = { topic, date, students, CiaanId };

    const updatedRecord = await ExtraAttendance.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Extra attendance record with this ID was not found.' });
    }

    res.status(200).json({ message: 'Extra attendance updated successfully!', data: updatedRecord });

  } catch (error) {
    console.error('Error updating extra attendance:', error);
    res.status(500).json({ message: 'Server error while updating extra attendance.', error: error.message });
  }
});

module.exports = router;
