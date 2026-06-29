const express = require('express');
const router = express.Router();
const TheoryAttendance = require('../models/TheoryAttendance'); 

/**
 * @route   GET /api/attendance/:ciannId
 * @desc    Get aggregated attendance data for a specific CIAAN ID.
 * @access  Public
 */
router.get('/:ciannId', async (req, res) => {
  try {
    // 1. Get the ID from params and convert it to a number
    const ciannIdAsNumber = parseInt(req.params.ciannId, 10);

    // 2. Add a check to ensure it's a valid number
    if (isNaN(ciannIdAsNumber)) {
      return res.status(400).json({ msg: 'Invalid CIAAN ID format. It must be a number.' });
    }

    // 3. Use the number in your database query
    const attendanceRecords = await TheoryAttendance.find({ ciannId: ciannIdAsNumber }).lean();

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ msg: 'No attendance records found for this CIAAN ID.' });
    }

    // Process the records to create the structure the frontend needs
    const studentAttendanceMap = new Map();
    const dateSet = new Set();

    for (const record of attendanceRecords) {
      const recordDate = new Date(record.date).toISOString().split('T')[0]; // 'YYYY-MM-DD'
      dateSet.add(recordDate);

      for (const student of record.students) {
        const { rollNo, studentName, status } = student;

        if (!studentAttendanceMap.has(rollNo)) {
          studentAttendanceMap.set(rollNo, {
            rollNo: rollNo,
            studentName: studentName || student.studentName || '',
            attendance: {}, // This object will hold date:status pairs
          });
        }

        const studentData = studentAttendanceMap.get(rollNo);
        studentData.attendance[recordDate] = status;
      }
    }

    // Assemble the final payload for the frontend
    const responsePayload = {
      dates: Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b)),
      students: Array.from(studentAttendanceMap.values()),
    };

    // Send the formatted data
    res.json(responsePayload);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;