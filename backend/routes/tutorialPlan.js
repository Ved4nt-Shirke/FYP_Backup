const express = require('express');
const router = express.Router();
const TutorialPlan = require('../models/TutorialPlan');
const checkCiannFreeze = require('../middleware/checkFreeze');

// GET tutorial plans for a specific ciannId
router.get('/:ciannId', async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);
    
    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }
    
    const plans = await TutorialPlan.find({ ciannId: numericCiannId }).lean();
    if (!plans || plans.length === 0) {
      return res.json([]);
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new tutorial plan
router.post('/', checkCiannFreeze, async (req, res) => {
  try {
    const { ciannId, weekNo, plans } = req.body;
    if (typeof weekNo !== 'number') {
      return res.status(400).json({ message: 'weekNo must be a number.' });
    }
    const newPlan = new TutorialPlan({ ciannId, weekNo, plans });
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tutorial plan', error: error.message });
  }
});

// PUT to update or create a tutorial plan by ciannId and weekNo
router.put('/:ciannId/:weekNo', checkCiannFreeze, async (req, res) => {
  try {
    const { ciannId } = req.params;
    const weekNo = parseInt(req.params.weekNo, 10);
    const numericCiannId = parseInt(ciannId);
    const { plans } = req.body;

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }

    if (isNaN(weekNo)) {
      return res.status(400).json({ message: 'Week number must be a valid integer.' });
    }

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ message: 'Plans array is required and must not be empty.' });
    }

    const updatedPlan = await TutorialPlan.findOneAndUpdate(
      { ciannId: numericCiannId, weekNo },
      { $set: { plans: plans } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(updatedPlan);
  } catch (error) {
    console.error("Error in PUT /tutorial-plan:", error);
    res.status(400).json({ message: 'Error updating tutorial plan', error: error.message });
  }
});

module.exports = router;
