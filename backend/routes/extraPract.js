const express = require('express');
const router = express.Router();
const ExtraPract = require('../models/ExtraPract');

// POST /api/extra-pract
router.post('/', async (req, res) => {
  try {
    const { ciannId, experiments, actualDate, batch, students } = req.body;

    if (!ciannId) {
      return res.status(400).json({ message: "ciannId is required" });
    }

    const newEntry = new ExtraPract({
      ciannId,
      experiments,
      actualDate,
      batch,
      students
    });

    await newEntry.save();
    res.status(200).json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving extra practical attendance" });
  }
});

// GET /api/extra-pract
router.get('/', async (req, res) => {
  try {
    const { ciannId } = req.query;
    let query = {};
    
    if (ciannId) {
      query.ciannId = parseInt(ciannId);
    }
    
    const records = await ExtraPract.find(query);
    res.json(records);
  } catch (err) {
    console.error("Error fetching extra practical records:", err);
    res.status(500).json({ message: "Error fetching records" });
  }
});

// GET /api/extra-pract/:id - Get a specific record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ExtraPract.findById(id);
    
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    res.json(record);
  } catch (err) {
    console.error("Error fetching extra practical record:", err);
    res.status(500).json({ message: "Error fetching record" });
  }
});

// PUT /api/extra-pract/:id - Update a specific record by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ciannId, experiments, actualDate, batch, students } = req.body;
    
    const updatedRecord = await ExtraPract.findByIdAndUpdate(
      id,
      {
        ciannId,
        experiments,
        actualDate,
        batch,
        students
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    res.json(updatedRecord);
  } catch (err) {
    console.error("Error updating extra practical record:", err);
    res.status(500).json({ message: "Error updating record" });
  }
});

module.exports = router;