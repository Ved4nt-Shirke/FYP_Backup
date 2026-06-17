const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PTMicroProject = require('../models/PTMicroProject');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');
const PTConfiguration = require('../models/PTConfiguration');
const StudentPTMarks = require('../models/StudentPTMarks');
const Ciann = require('../models/Ciann');
const CourseDetails = require('../models/CourseDetails');
const Division = require('../models/Division');
const Subject = require('../models/Subject');
const Course = require('../models/Course');

// Middleware: authenticate all routes
router.use(authenticate);

// GET: Fetch all students for a particular division/course
router.get('/students', async (req, res) => {
  try {
    const { divisionId, courseId, departmentId, batch /* institution intentionally ignored */ } = req.query;

    // Debug log to help trace issues when students are unexpectedly empty
    console.log('=== PTMicroProject /students Request ===');
    console.log('Query params:', req.query);

    // Build filter with fallback logic
    let filter = {};
    
    // Priority 1: If divisionId is provided, use it (most specific)
    if (divisionId) {
      filter.divisionId = divisionId;
      console.log('Filter by divisionId:', divisionId);
    }
    // Priority 2: If courseId is provided, try using it
    else if (courseId) {
      filter.courseId = courseId;
      console.log('Filter by courseId:', courseId);
    }
    // Priority 3: If departmentId is provided, use it
    else if (departmentId) {
      filter.departmentId = departmentId;
      console.log('Filter by departmentId:', departmentId);
    }
    // Priority 4: If batch is provided, use it
    else if (batch) {
      filter.batch = batch;
      console.log('Filter by batch:', batch);
    }
    // Priority 5: If nothing provided, return ALL students (for testing)
    else {
      console.log('No filter criteria provided - returning ALL students');
    }

    console.log('Built filter:', filter);

    let students = await Student.find(filter).select('_id studentName rollNo enrollmentNo batch departmentId courseId divisionId');
    
    console.log(`Found ${students.length} students with filter:`, filter);

    // If no students found with specific filter, try broader fallback
    if (students.length === 0 && (courseId || divisionId || departmentId)) {
      console.log('No students found with specific filter - trying batch fallback...');
      
      // If batch was specified, already tried it above
      if (!batch) {
        // Try to find ANY students if nothing worked
        students = await Student.find({}).select('_id studentName rollNo enrollmentNo batch departmentId courseId divisionId').limit(50);
        console.log(`Fallback: Found ${students.length} total students in database`);
      }
    }

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

// === NEW PT & MICROPROJECT MODULE ENDPOINTS ===

// GET: Fetch PT Configuration for a specific CIANN and Subject
router.get('/new/config/:ciannId/:subjectId', async (req, res) => {
  try {
    const { ciannId, subjectId } = req.params;
    const facultyId = req.user._id;

    const config = await PTConfiguration.findOne({
      facultyId,
      ciannId: Number(ciannId),
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
      ciannId,
      courseId,
      semester,
      divisionId,
      subjectId,
      academicYear,
      slaMarks,
      components
    } = req.body;
    const facultyId = req.user._id;

    if (!ciannId || !courseId || !semester || !divisionId || !subjectId || !academicYear || slaMarks === undefined || !components) {
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
      { facultyId, ciannId: Number(ciannId), subjectId },
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

// GET: Fetch students dynamically for a specific CIANN card
router.get('/new/students/:ciannId', async (req, res) => {
  try {
    const { ciannId } = req.params;
    const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
    if (!ciann) {
      return res.status(404).json({
        success: false,
        message: 'CIANN not found'
      });
    }

    // Resolve courseId from CIANN (dynamically resolve if not present directly)
    let courseId = ciann.courseId;
    if (!courseId) {
      let deptId = null;
      if (ciann.department) {
        if (mongoose.Types.ObjectId.isValid(ciann.department.toString())) {
          deptId = ciann.department;
        } else if (ciann.department._id && mongoose.Types.ObjectId.isValid(ciann.department._id.toString())) {
          deptId = ciann.department._id;
        } else if (typeof ciann.department === 'object') {
          const Department = require('../models/Department');
          const deptName = ciann.department.label || ciann.department.name;
          const deptCode = ciann.department.code || ciann.department.value;

          const nameMapping = {
            "computer engineering": "CO",
            "computer-engineering": "CO",
            "computer science": "CO",
            "cse": "CO",
            "co": "CO",
            "electronics": "ET",
            "electronics engineering": "ET",
            "et": "ET",
            "automation and robotics": "AI",
            "automation and robitics": "AI",
            "automation & robotics": "AI",
            "ai": "AI"
          };

          const searchTerms = [deptName, deptCode].filter(Boolean);
          const searchCodes = searchTerms.map(term => nameMapping[term.toLowerCase()]).filter(Boolean);

          const queryOr = [];
          searchTerms.forEach(term => {
            queryOr.push({ name: new RegExp(`^${term}$`, "i") });
            queryOr.push({ code: new RegExp(`^${term}$`, "i") });
          });
          searchCodes.forEach(c => {
            queryOr.push({ code: new RegExp(`^${c}$`, "i") });
          });

          if (queryOr.length > 0) {
            const deptDoc = await Department.findOne({ $or: queryOr });
            if (deptDoc) {
              deptId = deptDoc._id;
            }
          }
        }
      }

      if (deptId && ciann.semester) {
        const courseDoc = await Course.findOne({
          semester: parseInt(ciann.semester),
          departmentId: deptId
        });
        if (courseDoc) {
          courseId = courseDoc._id;
        }
      }
    }

    console.log(`[PTMicroProject students] ciannId: ${ciannId}, resolved courseId: ${courseId}`);

    // Resolve Division ID using CIANN's division name (e.g. "A") and courseId
    const divisionDoc = await Division.findOne({
      courseId: courseId,
      name: ciann.division
    });

    const query = {
      courseId: courseId
    };

    if (divisionDoc) {
      query.$or = [
        { divisionId: divisionDoc._id },
        { division: ciann.division }
      ];
    } else {
      query.division = ciann.division;
    }

    const students = await Student.find(query)
      .select('_id studentName rollNo enrollmentNo batch departmentId courseId divisionId')
      .sort({ rollNo: 1 });

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    console.error('Error fetching CIANN students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CIANN students: ' + error.message
    });
  }
});

// GET: Fetch Student PT Marks for a CIANN and Subject
router.get('/new/marks/:ciannId/:subjectId', async (req, res) => {
  try {
    const { ciannId, subjectId } = req.params;
    const marks = await StudentPTMarks.find({
      ciannId: Number(ciannId),
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
    const { ciannId, subjectId, status, studentsMarks } = req.body;
    const facultyId = req.user._id;

    if (!ciannId || !subjectId || !status || !studentsMarks || !Array.isArray(studentsMarks)) {
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
        { studentId, subjectId, ciannId: Number(ciannId) },
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
