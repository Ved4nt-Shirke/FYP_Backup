const express = require('express');
const router = express.Router();
const LabPlanning = require('../models/LabPlanning');

// GET all lab plans
router.get('/', async (req, res) => {
  try {
    const plans = await LabPlanning.find().lean();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET lab plans for a specific ciannId
router.get('/:ciannId', async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);
    
    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }
    
    const plans = await LabPlanning.find({ ciannId: numericCiannId }).lean();
    if (!plans || plans.length === 0) {
      return res.status(404).json({ message: 'No lab plans found for this CIAAN' });
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new lab plan (with upsert functionality)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/lab-planning - Request body:', req.body);
    const { ciannId, weekNo, plans } = req.body;
    
    // Validation
    if (!ciannId) {
      return res.status(400).json({ message: 'ciannId is required' });
    }
    if (!weekNo) {
      return res.status(400).json({ message: 'weekNo is required' });
    }
    if (!plans || !Array.isArray(plans)) {
      return res.status(400).json({ message: 'plans must be an array' });
    }
    
    // Validate each plan entry
    for (const plan of plans) {
      if (!plan.batch || !plan.exptNo || !plan.exptName || !plan.date) {
        return res.status(400).json({ 
          message: 'Each plan must have batch, exptNo, exptName, and date' 
        });
      }
    }
    
    console.log('Creating/updating lab plan with:', { ciannId, weekNo, plans });
    
    // Use findOneAndUpdate with upsert to handle both create and update
    const savedPlan = await LabPlanning.findOneAndUpdate(
      { ciannId, weekNo },
      { plans },
      { new: true, upsert: true, runValidators: true }
    );
    
    console.log('Lab plan saved successfully:', savedPlan);
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error('Error creating lab plan:', error);
    if (error.code === 11000) {
      res.status(409).json({ message: 'Lab plan for this week already exists', error: error.message });
    } else {
      res.status(400).json({ message: 'Error creating lab plan', error: error.message });
    }
  }
});

// PUT to update a lab plan by ciannId and weekNo
router.put('/:ciannId/:weekNo', async (req, res) => {
  try {
    const { ciannId, weekNo } = req.params;
    const { plans } = req.body;
    
    const numericCiannId = parseInt(ciannId);
    const numericWeekNo = parseInt(weekNo);
    
    if (isNaN(numericCiannId) || isNaN(numericWeekNo)) {
      return res.status(400).json({ message: 'Invalid ciannId or weekNo format' });
    }
    
    const updatedPlan = await LabPlanning.findOneAndUpdate(
      { ciannId: numericCiannId, weekNo: numericWeekNo },
      { plans },
      { new: true, upsert: true }
    );
    res.json(updatedPlan);
  } catch (error) {
    res.status(400).json({ message: 'Error updating lab plan', error: error.message });
  }
});

// PUT to update a specific plan entry within a lab plan
router.put('/:ciannId/:weekNo/:batch/:exptNo', async (req, res) => {
  try {
    const { ciannId, weekNo, batch, exptNo } = req.params;
    const { actualDate, remark } = req.body;
    
    const numericCiannId = parseInt(ciannId);
    const numericWeekNo = parseInt(weekNo);
    
    if (isNaN(numericCiannId) || isNaN(numericWeekNo)) {
      return res.status(400).json({ message: 'Invalid ciannId or weekNo format' });
    }
    
    // Find the lab plan and update the specific plan entry
    const labPlan = await LabPlanning.findOne({ 
      ciannId: numericCiannId, 
      weekNo: numericWeekNo 
    });
    
    if (!labPlan) {
      return res.status(404).json({ message: 'Lab plan not found' });
    }
    
    // Find and update the specific plan entry
    const planIndex = labPlan.plans.findIndex(plan => 
      plan.batch === batch && plan.exptNo === exptNo
    );
    
    if (planIndex === -1) {
      return res.status(404).json({ message: 'Plan entry not found' });
    }
    
    // Update the plan entry
    labPlan.plans[planIndex].actualDate = actualDate;
    labPlan.plans[planIndex].remark = remark;
    
    await labPlan.save();
    
    res.json({
      message: 'Plan entry updated successfully',
      updatedPlan: labPlan.plans[planIndex]
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating plan entry', error: error.message });
  }
});

// DELETE all lab plans for a specific ciannId (for cleanup/reset)
router.delete('/ciann/:ciannId', async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);
    
    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }
    
    const result = await LabPlanning.deleteMany({ ciannId: numericCiannId });
    res.json({ 
      message: `Deleted ${result.deletedCount} lab plans for CIANN ${numericCiannId}`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lab plans', error: error.message });
  }
});

module.exports = router;