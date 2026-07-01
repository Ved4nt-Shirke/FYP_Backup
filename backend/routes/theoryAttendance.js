// routes/theoryAttendance.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Make sure mongoose is required
const TheoryAttendance = require('../models/TheoryAttendance');
const Ciaan = require('../models/Ciann');
const checkCiaanFreeze = require('../middleware/checkFreeze');

// Your existing POST route for creating new attendance
router.post('/', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId } = req.body;
    const ciaanDoc = await Ciaan.findOne({ CiaanId });
    if (!ciaanDoc) {
      return res.status(400).json({ error: 'Invalid CIAAN ID. No matching CIAAN found.' });
    }
    const newRecord = new TheoryAttendance(req.body);
    await newRecord.save();
    res.status(201).json({ message: 'Attendance saved successfully.' });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET route for fetching attendance records — returns [] if no CIAAN or no records
router.get('/', async (req, res) => {
  try {
    const { CiaanId } = req.query;
    if (!CiaanId) {
      return res.status(400).json({ error: 'CIAAN ID is required' });
    }
    const ciaanDoc = await Ciaan.findOne({ CiaanId: parseInt(CiaanId) });
    if (!ciaanDoc) {
      // Return empty array instead of 404 — CIAAN may exist but have no records yet
      return res.status(200).json([]);
    }
    const records = await TheoryAttendance.find({ CiaanId });
    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});


// ✅ ADD THIS NEW ROUTE for updating an existing attendance record
router.put('/:id', checkCiaanFreeze, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, remark, students, topic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format.' });
    }

    const updateData = { date, remark, students, topic };

    const updatedRecord = await TheoryAttendance.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Attendance record with this ID was not found.' });
    }

    res.status(200).json({ message: 'Attendance updated successfully!', data: updatedRecord });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Server error while updating attendance.', error: error.message });
  }
});


module.exports = router;