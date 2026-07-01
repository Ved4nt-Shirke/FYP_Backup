const express = require('express');
const router = express.Router();
const PracticalAttendance = require('../models/PracticalAttendance');

// Debug route to check all practical attendance data
router.get('/debug/all', async (req, res) => {
  try {
    const allRecords = await PracticalAttendance.find({}).lean();
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
 * @route   GET /api/view-practical-attendance/:CiaanId
 * @desc    Get aggregated practical attendance data for a specific CIAAN ID organized by batch.
 * @access  Public
 */
router.get('/:CiaanId', async (req, res) => {
  try {
    console.log('GET /api/view-practical-attendance/:CiaanId - Request params:', req.params);

    // 1. Get the ID from params and convert it to a number
    const CiaanIdAsNumber = parseInt(req.params.CiaanId, 10);
    console.log('Parsed CIAAN ID:', CiaanIdAsNumber);

    // 2. Add a check to ensure it's a valid number
    if (isNaN(CiaanIdAsNumber)) {
      console.log('Invalid CIAAN ID format');
      return res.status(400).json({ msg: 'Invalid CIAAN ID format. It must be a number.' });
    }

    // 3. Use the number in your database query
    console.log('Searching for practical attendance records with CiaanId:', CiaanIdAsNumber);
    const practicalAttendanceRecords = await PracticalAttendance.find({ CiaanId: CiaanIdAsNumber }).lean();
    console.log('Found records:', practicalAttendanceRecords.length);

    if (!practicalAttendanceRecords || practicalAttendanceRecords.length === 0) {
      console.log('No practical attendance records found for CIAAN ID:', CiaanIdAsNumber);
      return res.status(404).json({ msg: 'No practical attendance records found for this CIAAN ID.' });
    }

    // Process the records to create the structure the frontend needs
    const batchDataMap = new Map();
    const weekSet = new Set();

    for (const record of practicalAttendanceRecords) {
      const { weekNo, batch, exptNo, exptName, actualDate, remark } = record;

      weekSet.add(weekNo);

      if (!batchDataMap.has(batch)) {
        batchDataMap.set(batch, {
          batch: batch,
          experiments: new Map()
        });
      }

      const batchData = batchDataMap.get(batch);
      const experimentKey = `${exptNo}-${exptName}`;

      if (!batchData.experiments.has(experimentKey)) {
        batchData.experiments.set(experimentKey, {
          exptNo: exptNo,
          exptName: exptName,
          weeks: {}
        });
      }

      const experimentData = batchData.experiments.get(experimentKey);
      experimentData.weeks[weekNo] = {
        actualDate: actualDate || '',
        remark: remark || '',
        studentsCount: record.students ? record.students.length : 0,
        presentCount: record.students ? record.students.filter(s => s.status === 'Present').length : 0
      };
    }

    // Convert Maps to Arrays for easier frontend consumption
    const batchesData = Array.from(batchDataMap.values()).map(batchData => ({
      batch: batchData.batch,
      experiments: Array.from(batchData.experiments.values())
    }));

    // Assemble the final payload for the frontend
    const responsePayload = {
      weeks: Array.from(weekSet).sort((a, b) => a - b),
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
 * @route   GET /api/view-practical-attendance/:CiaanId/:batch
 * @desc    Get practical attendance data for a specific CIAAN ID and batch.
 * @access  Public
 */
router.get('/:CiaanId/:batch', async (req, res) => {
  try {
    const CiaanIdAsNumber = parseInt(req.params.CiaanId, 10);
    const { batch } = req.params;

    if (isNaN(CiaanIdAsNumber)) {
      return res.status(400).json({ msg: 'Invalid CIAAN ID format. It must be a number.' });
    }

    const practicalAttendanceRecords = await PracticalAttendance.find({
      CiaanId: CiaanIdAsNumber,
      batch: batch
    }).lean();

    if (!practicalAttendanceRecords || practicalAttendanceRecords.length === 0) {
      return res.status(404).json({ msg: `No practical attendance records found for batch ${batch}.` });
    }

    // Process records for the specific batch
    const batchExperiments = new Map();
    const weekSet = new Set();

    for (const record of practicalAttendanceRecords) {
      const { weekNo, exptNo, exptName, actualDate, remark, students } = record;

      weekSet.add(weekNo);
      const experimentKey = `${exptNo}-${exptName}`;

      if (!batchExperiments.has(experimentKey)) {
        batchExperiments.set(experimentKey, {
          exptNo: exptNo,
          exptName: exptName,
          weeks: {}
        });
      }

      const experimentData = batchExperiments.get(experimentKey);
      experimentData.weeks[weekNo] = {
        actualDate: actualDate || '',
        remark: remark || '',
        studentsCount: students ? students.length : 0,
        presentCount: students ? students.filter(s => s.status === 'Present').length : 0,
        students: students || []
      };
    }

    const responsePayload = {
      batch: batch,
      weeks: Array.from(weekSet).sort((a, b) => a - b),
      experiments: Array.from(batchExperiments.values())
    };

    res.json(responsePayload);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;