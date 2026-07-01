const express = require('express');
const router = express.Router();
const TeachingPlan = require('../models/TeachingPlan');
const checkCiaanFreeze = require('../middleware/checkFreeze');

// GET teaching plans for a specific CiaanId
router.get('/:CiaanId', async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: 'Invalid CiaanId format' });
    }

    const plans = await TeachingPlan.find({ CiaanId: numericCiaanId }).lean();
    if (!plans || plans.length === 0) {
      // Return empty list with 200 to avoid frontend 404 noise and simplify handling
      return res.json([]);
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new teaching plan
router.post('/', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId, weekNo, plans } = req.body;
    if (typeof weekNo !== 'number') {
      return res.status(400).json({ message: 'weekNo must be a number.' });
    }
    const newPlan = new TeachingPlan({ CiaanId, weekNo, plans });
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: 'Error creating teaching plan', error: error.message });
  }
});

// PUT to update or create a teaching plan by CiaanId and weekNo
router.put('/:CiaanId/:weekNo', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const weekNo = parseInt(req.params.weekNo, 10);
    const numericCiaanId = parseInt(CiaanId);
    const { plans } = req.body;

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: 'Invalid CiaanId format' });
    }

    if (isNaN(weekNo)) {
      return res.status(400).json({ message: 'Week number must be a valid integer.' });
    }

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: 'Plans array is required and must not be empty.' });
    }

    console.log("PUT request data:", { CiaanId: numericCiaanId, weekNo, plans }); // Debug log

    const updatedPlan = await TeachingPlan.findOneAndUpdate(
      { CiaanId: numericCiaanId, weekNo },
      { $set: { plans: plans } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(updatedPlan);
  } catch (error) {
    console.error("Error in PUT /teaching-plan:", error);
    res.status(400).json({ message: 'Error updating teaching plan', error: error.message });
  }
});

module.exports = router;