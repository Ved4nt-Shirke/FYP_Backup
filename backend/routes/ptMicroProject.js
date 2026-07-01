const express = require('express');
const router = express.Router();
const PTMicroProject = require('../models/PTMicroProject');
const Student = require('../models/Student');
const { resolveStudents } = require('../utils/studentHistoryHelper');
const { authenticate } = require('../middleware/auth');
const PTConfiguration = require('../models/PTConfiguration');
const StudentPTMarks = require('../models/StudentPTMarks');
const Ciaan = require('../models/Ciann');
const CourseDetails = require('../models/CourseDetails');
const Division = require('../models/Division');
const Subject = require('../models/Subject');

// Middleware: authenticate all routes
router.use(authenticate);

// GET: Fetch all students for a particular division/course
router.get('/students', async (req, res) => {
  try {
    console.log('=== PTMicroProject /students Request ===');
    console.log('Query params:', req.query);

    const students = await resolveStudents(req.query, req.user.college);

    res.json({
      success: true,
      data: students,
      count: students.length,
      message: students.length === 0 ? 'No students found for the selected criteria' : `Found ${students.length} students`
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students: ' + error.message
    });
  }
});

// GET: Fetch saved max marks for an activity type (from last saved entry)
router.get('/activity-settings/:activityType', async (req, res) => {
  try {
    const { activityType } = req.params;
    const { institution, CiaanId } = req.query;

    // Get the latest max marks saved for this activity by this user
    const setting = await PTMicroProject.findOne({
      activityType: activityType,
      institution: institution,
      facultyId: req.user._id,
      ...(CiaanId ? { CiaanId: Number(CiaanId) } : {})
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
    const { courseId, CiaanId } = req.query;

    let filter = {
      studentId,
      activityType
    };

    if (courseId) filter.courseId = courseId;
    if (CiaanId) filter.CiaanId = Number(CiaanId);

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
      CiaanId,
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

    if (CiaanId !== undefined && CiaanId !== null && CiaanId !== '') {
      searchFilter.CiaanId = Number(CiaanId);
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
      existingMarks.CiaanId =
        CiaanId !== undefined && CiaanId !== null && CiaanId !== ''
          ? Number(CiaanId)
          : existingMarks.CiaanId;
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
        CiaanId:
          CiaanId !== undefined && CiaanId !== null && CiaanId !== ''
            ? Number(CiaanId)
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
    const { courseId, divisionId, batch, CiaanId, institution } = req.query;

    let filter = { activityType };
    if (courseId) filter.courseId = courseId;
    if (divisionId) filter.divisionId = divisionId;
    if (batch) filter.batch = batch;
    if (CiaanId) filter.CiaanId = Number(CiaanId);
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

// === NEW PT & MICROPROJECT MODULE ENDPOINTS ===

// GET: Fetch PT Configuration for a specific Ciaan and Subject
router.get('/new/config/:CiaanId/:subjectId', async (req, res) => {
  try {
    const { CiaanId, subjectId } = req.params;
    const facultyId = req.user._id;

    const config = await PTConfiguration.findOne({
      facultyId,
      CiaanId: Number(CiaanId),
      subjectId
    });

    res.json({
      success: true,
      config: config || null
    });
  } catch (error) {
    console.error('Error fetching PT configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PT configuration: ' + error.message
    });
  }
});

// POST: Save/Update PT Configuration
router.post('/new/config', async (req, res) => {
  try {
    const {
      CiaanId,
      courseId,
      semester,
      divisionId,
      subjectId,
      academicYear,
      slaMarks,
      components
    } = req.body;
    const facultyId = req.user._id;

    if (!CiaanId || !courseId || !semester || !divisionId || !subjectId || !academicYear || slaMarks === undefined || !components) {
      return res.status(400).json({
        success: false,
        message: 'Missing required configuration fields'
      });
    }

    // Validate component total
    const total = components.reduce((sum, c) => sum + Number(c.maxMarks), 0);
    if (total > Number(slaMarks)) {
      return res.status(400).json({
        success: false,
        message: `Total component marks (${total}) cannot exceed SLA marks (${slaMarks})`
      });
    }

    const updatedConfig = await PTConfiguration.findOneAndUpdate(
      { facultyId, CiaanId: Number(CiaanId), subjectId },
      {
        courseId,
        semester,
        divisionId,
        subjectId,
        academicYear,
        slaMarks: Number(slaMarks),
        components
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'PT configuration saved successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Error saving PT configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving PT configuration: ' + error.message
    });
  }
});

// GET: Fetch course details and SLA marks for a subject
router.get('/new/course-details/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const details = await CourseDetails.findOne({ subjectId }).populate('subjectId');
    res.json({
      success: true,
      courseDetails: details || null
    });
  } catch (error) {
    console.error('Error fetching course details for PT:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details: ' + error.message
    });
  }
});

// GET: Fetch students dynamically for a specific Ciaan card
router.get('/new/students/:CiaanId', async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const ciaanDoc = await Ciaan.findOne({ CiaanId: Number(CiaanId) });
    if (!ciaanDoc) {
      return res.status(404).json({
        success: false,
        message: 'Ciaan not found'
      });
    }

    const students = await resolveStudents({
      courseId: ciaanDoc.courseId,
      division: ciaanDoc.division,
      academicYear: ciaanDoc.academicYear,
      semester: ciaanDoc.semester
    }, req.user.college);

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching Ciaan students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Ciaan students: ' + error.message
    });
  }
});

// GET: Fetch Student PT Marks for a Ciaan and Subject
router.get('/new/marks/:CiaanId/:subjectId', async (req, res) => {
  try {
    const { CiaanId, subjectId } = req.params;
    const marks = await StudentPTMarks.find({
      CiaanId: Number(CiaanId),
      subjectId
    }).populate('studentId', 'studentName rollNo');

    res.json({
      success: true,
      data: marks
    });
  } catch (error) {
    console.error('Error fetching student PT marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student PT marks: ' + error.message
    });
  }
});

// POST: Save/Submit Student PT Marks
router.post('/new/marks', async (req, res) => {
  try {
    const { CiaanId, subjectId, status, studentsMarks } = req.body;
    const facultyId = req.user._id;

    if (!CiaanId || !subjectId || !status || !studentsMarks || !Array.isArray(studentsMarks)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required marks fields'
      });
    }

    const savedEntries = [];
    const submittedAt = status === 'submitted' ? new Date() : null;

    for (const entry of studentsMarks) {
      const { studentId, marks, totalMarks } = entry;

      if (!studentId || !marks || totalMarks === undefined) {
        continue;
      }

      // Upsert student marks entry
      const saved = await StudentPTMarks.findOneAndUpdate(
        { studentId, subjectId, CiaanId: Number(CiaanId) },
        {
          facultyId,
          marks,
          totalMarks: Number(totalMarks),
          status,
          submittedAt: status === 'submitted' ? submittedAt : undefined
        },
        { new: true, upsert: true, runValidators: true }
      );
      savedEntries.push(saved);
    }

    res.json({
      success: true,
      message: `Marks saved successfully as ${status}`,
      count: savedEntries.length
    });
  } catch (error) {
    console.error('Error saving student PT marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving student PT marks: ' + error.message
    });
  }
});

module.exports = router;
