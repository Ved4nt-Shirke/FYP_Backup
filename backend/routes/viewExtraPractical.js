const express = require('express');
const router = express.Router();
const ExtraPract = require('../models/ExtraPract');

// Debug route to check all extra practical data
router.get('/debug/all', async (req, res) => {
  try {
    const allRecords = await ExtraPract.find({}).lean();
    res.json({
      count: allRecords.length,
      records: allRecords.slice(0, 5), // Show first 5 records
      CiaanIds: [...new Set(allRecords.map(r => r.CiaanId))]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/view-extra-practical/:CiaanId
 * @desc    Get aggregated extra practical attendance data for a specific CIAAN ID organized by batch.
 * @access  Public
 */
router.get('/:CiaanId', async (req, res) => {
  try {
    console.log('GET /api/view-extra-practical/:CiaanId - Request params:', req.params);

    // 1. Get the ID from params and convert it to a number
    const CiaanIdAsNumber = parseInt(req.params.CiaanId, 10);
    console.log('Parsed CIAAN ID:', CiaanIdAsNumber);

    // 2. Add a check to ensure it's a valid number
    if (isNaN(CiaanIdAsNumber)) {
      console.log('Invalid CIAAN ID format');
      return res.status(400).json({ msg: 'Invalid CIAAN ID format. It must be a number.' });
    }

    // 3. Use the number in your database query
    console.log('Searching for extra practical records with CiaanId:', CiaanIdAsNumber);
    const extraPractRecords = await ExtraPract.find({ CiaanId: CiaanIdAsNumber }).lean();
    console.log('Found records:', extraPractRecords.length);

    if (!extraPractRecords || extraPractRecords.length === 0) {
      console.log('No extra practical records found for CIAAN ID:', CiaanIdAsNumber);
      return res.status(404).json({ msg: 'No extra practical attendance records found for this CIAAN ID.' });
    }

    // Process the records to create the structure the frontend needs
    const batchDataMap = new Map();

    for (const record of extraPractRecords) {
      const { batch, experiments, actualDate, students } = record;

      if (!batchDataMap.has(batch)) {
        batchDataMap.set(batch, {
          batch: batch,
          experiments: []
        });
      }

      const batchData = batchDataMap.get(batch);
      batchData.experiments.push({
        experiments: experiments,
        actualDate: actualDate || '',
        studentsCount: students ? students.length : 0,
        presentCount: students ? students.filter(s => s.attendance === 'Present').length : 0,
        students: students || []
      });
    }

    // Convert Maps to Arrays for easier frontend consumption
    const batchesData = Array.from(batchDataMap.values());

    // Assemble the final payload for the frontend
    const responsePayload = {
      batches: batchesData
    };

    // Send the formatted data
    res.json(responsePayload);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/view-extra-practical/:CiaanId/:batch
 * @desc    Get extra practical attendance data for a specific CIAAN ID and batch.
 * @access  Public
 */
router.get('/:CiaanId/:batch', async (req, res) => {
  try {
    const CiaanIdAsNumber = parseInt(req.params.CiaanId, 10);
    const { batch } = req.params;

    if (isNaN(CiaanIdAsNumber)) {
      return res.status(400).json({ msg: 'Invalid CIAAN ID format. It must be a number.' });
    }

    const extraPractRecords = await ExtraPract.find({
      CiaanId: CiaanIdAsNumber,
      batch: batch
    }).lean();

    if (!extraPractRecords || extraPractRecords.length === 0) {
      return res.status(404).json({ msg: `No extra practical attendance records found for batch ${batch}.` });
    }

    // Process records for the specific batch
    const experiments = extraPractRecords.map(record => ({
      experiments: record.experiments,
      actualDate: record.actualDate || '',
      studentsCount: record.students ? record.students.length : 0,
      presentCount: record.students ? record.students.filter(s => s.attendance === 'Present').length : 0,
      students: record.students || []
    }));

    const responsePayload = {
      batch: batch,
      experiments: experiments
    };

    res.json(responsePayload);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;