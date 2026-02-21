const express = require('express');
const router = express.Router();
const PTMicroProject = require('../models/PTMicroProject');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');

// Middleware: authenticate all routes
router.use(authenticate);

// GET: Fetch all students for a particular division/course
router.get('/students', async (req, res) => {
  try {
    const { divisionId, courseId, departmentId, batch, institution } = req.query;

    let filter = {};
    if (divisionId) filter.divisionId = divisionId;
    if (courseId) filter.courseId = courseId;
    if (departmentId) filter.departmentId = departmentId;
    if (batch) filter.batch = batch;
    if (institution) filter.institution = institution;

    const students = await Student.find(filter).select('_id studentName rollNo enrollmentNo batch');

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
});

// GET: Fetch saved max marks for an activity type (from last saved entry)
router.get('/activity-settings/:activityType', async (req, res) => {
  try {
    const { activityType } = req.params;
    const { institution, ciannId } = req.query;

    // Get the latest max marks saved for this activity by this user
    const setting = await PTMicroProject.findOne({
      activityType: activityType,
      institution: institution,
      facultyId: req.user._id,
      ...(ciannId ? { ciannId: Number(ciannId) } : {})
    })
      .sort({ createdAt: -1 })
      .select('maxMarks activityType');

    if (setting) {
      res.json({
        success: true,
        data: {
          activityType: setting.activityType,
          maxMarks: setting.maxMarks
        }
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error fetching activity settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity settings'
    });
  }
});

// GET: Fetch marks for a specific student and activity type
router.get('/get-marks/:studentId/:activityType', async (req, res) => {
  try {
    const { studentId, activityType } = req.params;
    const { courseId, ciannId } = req.query;

    let filter = {
      studentId,
      activityType
    };

    if (courseId) filter.courseId = courseId;
    if (ciannId) filter.ciannId = Number(ciannId);

    const marks = await PTMicroProject.findOne(filter);

    res.json({
      success: true,
      data: marks || null
    });
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marks'
    });
  }
});

// POST: Save/Update marks for a student
router.post('/save-marks', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      rollNo,
      activityType,
      marks,
      maxMarks,
      courseId,
      ciannId,
      subjectId,
      subjectName,
      divisionId,
      batch,
      institution,
      feedback
    } = req.body;

    // Validation
    if (!studentId || !activityType || marks === undefined || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, activityType, marks, maxMarks'
      });
    }

    // Validate maxMarks is one of the allowed values
    const allowedMaxMarks = [5, 10, 15, 20, 25];
    if (!allowedMaxMarks.includes(maxMarks)) {
      return res.status(400).json({
        success: false,
        message: 'maxMarks must be one of: 5, 10, 15, 20, 25'
      });
    }

    // Validate marks is within range
    if (marks < 0 || marks > maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${maxMarks}`
      });
    }

    // Build search filter - use institution as a key identifier
    let searchFilter = {
      studentId,
      activityType,
      institution
    };

    if (ciannId !== undefined && ciannId !== null && ciannId !== '') {
      searchFilter.ciannId = Number(ciannId);
    }
    
    // Add courseId if provided
    if (courseId) {
      searchFilter.courseId = courseId;
    }

    // Check if marks already exist for this student-activity combination
    let existingMarks = await PTMicroProject.findOne(searchFilter);

    if (existingMarks) {
      // Update existing marks
      existingMarks.marks = marks;
      existingMarks.maxMarks = maxMarks;
      existingMarks.feedback = feedback || '';
      existingMarks.status = 'Evaluated';
      existingMarks.facultyId = req.user._id;
      existingMarks.courseId = courseId || existingMarks.courseId;
      existingMarks.ciannId =
        ciannId !== undefined && ciannId !== null && ciannId !== ''
          ? Number(ciannId)
          : existingMarks.ciannId;
      existingMarks.subjectId = subjectId || existingMarks.subjectId;
      existingMarks.subjectName = subjectName || existingMarks.subjectName;
      existingMarks.divisionId = divisionId || existingMarks.divisionId;
      existingMarks.batch = batch || existingMarks.batch;
      await existingMarks.save();

      res.json({
        success: true,
        message: 'Marks updated successfully',
        data: existingMarks
      });
    } else {
      // Create new marks entry
      const newMarks = new PTMicroProject({
        studentId,
        studentName,
        rollNo,
        activityType,
        marks,
        maxMarks,
        courseId: courseId || 'default',
        ciannId:
          ciannId !== undefined && ciannId !== null && ciannId !== ''
            ? Number(ciannId)
            : undefined,
        subjectId,
        subjectName,
        divisionId,
        batch,
        institution,
        feedback: feedback || '',
        facultyId: req.user._id,
        status: 'Evaluated'
      });

      await newMarks.save();

      res.json({
        success: true,
        message: 'Marks saved successfully',
        data: newMarks
      });
    }
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving marks: ' + error.message
    });
  }
});

// GET: Fetch all marks for a student
router.get('/student-marks/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    let filter = { studentId };
    if (courseId) filter.courseId = courseId;

    const allMarks = await PTMicroProject.find(filter);

    res.json({
      success: true,
      data: allMarks
    });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student marks'
    });
  }
});

// GET: Fetch all marks by activity type
router.get('/activity/:activityType', async (req, res) => {
  try {
    const { activityType } = req.params;
    const { courseId, divisionId, batch, ciannId, institution } = req.query;

    let filter = { activityType };
    if (courseId) filter.courseId = courseId;
    if (divisionId) filter.divisionId = divisionId;
    if (batch) filter.batch = batch;
    if (ciannId) filter.ciannId = Number(ciannId);
    if (institution) filter.institution = institution;

    const marks = await PTMicroProject.find(filter)
      .populate('studentId', 'studentName rollNo')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: marks
    });
  } catch (error) {
    console.error('Error fetching activity marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity marks'
    });
  }
});

// DELETE: Delete marks entry
router.delete('/delete-marks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await PTMicroProject.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Marks entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Marks deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting marks'
    });
  }
});

module.exports = router;
