const express = require('express');
const router = express.Router();
const TutorialAttendance = require('../models/TutorialAttendance');
const checkCiannFreeze = require('../middleware/checkFreeze');

router.post('/', checkCiannFreeze, async (req, res) => {
  try {
    const { Topic, actualDate, ciannId, subject, division, students, remark } = req.body;
    
    // Basic validation
    if (!Topic || !actualDate || !ciannId || !students || students.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: Topic, actualDate, ciannId, and students are required' 
      });
    }
    
    const entry = new TutorialAttendance({
      Topic,
      actualDate,
      ciannId,
      subject,
      division,
      students,
      remark
    });
    
    await entry.save();
    res.status(201).json({ 
      message: "Tutorial attendance saved successfully",
      data: entry
    });
  } catch (err) {
    console.error('Error saving tutorial attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { ciannId } = req.query;
    console.log('GET /api/tutorial-attendance - Query params:', req.query);
    
    let query = {};
    if (ciannId) {
      query.ciannId = parseInt(ciannId);
      console.log('Searching for tutorial attendance with query:', query);
    }
    
    const records = await TutorialAttendance.find(query).sort({ createdAt: -1 });
    console.log('Found tutorial attendance records:', records.length);
    console.log('Records:', records);
    
    res.json(records);
  } catch (err) {
    console.error('Error fetching tutorial attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT route to update tutorial attendance
router.put('/:id', checkCiannFreeze, async (req, res) => {
  try {
    const { id } = req.params;
    const { Topic, actualDate, ciannId, subject, division, students, remark } = req.body;
    
    // Basic validation
    if (!Topic || !actualDate || !ciannId || !students || students.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: Topic, actualDate, ciannId, and students are required' 
      });
    }
    
    const updatedRecord = await TutorialAttendance.findByIdAndUpdate(
      id,
      {
        Topic,
        actualDate,
        ciannId,
        subject,
        division,
        students,
        remark
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ error: 'Tutorial attendance record not found' });
    }
    
    res.json({ 
      message: "Tutorial attendance updated successfully",
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error updating tutorial attendance:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;