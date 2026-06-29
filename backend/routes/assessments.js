const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Student = require('../models/Student');
const { resolveStudents } = require('../utils/studentHistoryHelper');
const Experiment = require('../models/Experiment');
const Ciann = require('../models/Ciann');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveDivisionFromQuery = async ({ ciannId, division }) => {
  const normalizedDivision = String(division || '').trim();
  if (normalizedDivision) return normalizedDivision;

  const numericCiannId = parseInt(ciannId, 10);
  if (!Number.isNaN(numericCiannId)) {
    const ciann = await Ciann.findOne({ ciannId: numericCiannId }).select('division');
    return String(ciann?.division || '').trim();
  }

  return '';
};

// GET all experiment documents (for debugging)
router.get('/all-experiments', async (req, res) => {
  try {
    const allExperiments = await Experiment.find({});
    res.json({ success: true, data: allExperiments });
  } catch (error) {
    console.error('Error fetching all experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET experiments by subject details (GET version with query parameters)
router.get('/get-experiments', async (req, res) => {
  try {
    const { program, className, course } = req.query;
    
    console.log('GET: Searching for experiments with:', { program, className, course });
    
    if (!program || !className || !course) {
      return res.status(400).json({ 
        success: false, 
        message: 'Program, className, and course query parameters are required' 
      });
    }

    const result = await Experiment.findOne({ program, className, course });
    console.log('GET: Database result:', result);
    
    if (!result) {
      // Strict fallback: anchored, case-insensitive AND match
      const p = (program || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const c = (className || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const s = (course || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let strict = await Experiment.findOne({
        program: { $regex: `^${p}$`, $options: 'i' },
        className: { $regex: `^${c}$`, $options: 'i' },
        course: { $regex: `^${s}$`, $options: 'i' },
      });
      
      // Fallback: Program + Course only (ignore className)
      if (!strict) {
        strict = await Experiment.findOne({
          program: { $regex: `^${p}$`, $options: 'i' },
          course: { $regex: `^${s}$`, $options: 'i' },
        });
      }
      
      console.log('GET: Strict search result:', strict);
      return res.json({ 
        success: true, 
        experiments: strict ? strict.experiments : [],
        message: strict ? 'Found with anchored search' : 'No experiments found'
      });
    }

    res.json({ success: true, experiments: result.experiments });
  } catch (error) {
    console.error('GET: Error fetching experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST experiments by subject details
router.post('/get-experiments', async (req, res) => {
  try {
    const { program, className, course } = req.body;
    
    console.log('Searching for experiments with:', { program, className, course });
    
    if (!program || !className || !course) {
      return res.status(400).json({ 
        success: false, 
        message: 'Program, className, and course are required' 
      });
    }

    const result = await Experiment.findOne({ program, className, course });
    console.log('Database result:', result);
    
    if (!result) {
      // Strict fallback: anchored, case-insensitive AND match
      const p = (program || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const c = (className || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const s = (course || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let strict = await Experiment.findOne({
        program: { $regex: `^${p}$`, $options: 'i' },
        className: { $regex: `^${c}$`, $options: 'i' },
        course: { $regex: `^${s}$`, $options: 'i' },
      });

      // Fallback: Program + Course only (ignore className)
      if (!strict) {
        strict = await Experiment.findOne({
          program: { $regex: `^${p}$`, $options: 'i' },
          course: { $regex: `^${s}$`, $options: 'i' },
        });
      }
      console.log('Strict search result:', strict);
      
      return res.json({ 
        success: true, 
        experiments: strict ? strict.experiments : [],
        message: strict ? 'Found with anchored search' : 'No experiments found'
      });
    }

    res.json({ success: true, experiments: result.experiments });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// POST save/update assessment marks with batch validation
router.post('/save-marks', async (req, res) => {
  try {
    const { 
      studentsMarks, 
      experimentId, 
      experimentName,
      batch,
      program,
      className: classCtx,
      course,
      ciannId
    } = req.body;

    console.log('=== SAVE MARKS REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Students marks count:', studentsMarks?.length);
    console.log('Experiment ID:', experimentId);
    console.log('Batch:', batch);

    if (!studentsMarks || !Array.isArray(studentsMarks) || studentsMarks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Students marks data is required' 
      });
    }

    if (!experimentId || !experimentName) {
      console.log('Missing experiment data - ID:', experimentId, 'Name:', experimentName);
      return res.status(400).json({ 
        success: false, 
        message: 'Experiment ID and name are required' 
      });
    }

    // Validate experimentId is a valid number
    const experimentNumber = parseInt(experimentId);
    if (isNaN(experimentNumber)) {
      console.log('Invalid experiment ID:', experimentId, 'parsed as:', experimentNumber);
      return res.status(400).json({ 
        success: false, 
        message: 'Experiment ID must be a valid number' 
      });
    }

    // If batch is provided, validate that all students belong to that batch
    if (batch) {
      console.log('Validating batch:', batch);
      let batchStudents = [];
      if (ciannId) {
        const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
        if (ciann) {
          batchStudents = await resolveStudents({
            batch: batch,
            academicYear: ciann.academicYear,
            semester: ciann.semester
          }, ciann.college);
        }
      }
      if (batchStudents.length === 0) {
        batchStudents = await Student.find({ batch: batch }).select('studentName rollNo');
      }
      console.log('Found batch students:', batchStudents.length);
      console.log('Batch student names:', batchStudents.map(s => s.studentName));
      
      const batchStudentNames = batchStudents.map(s => s.studentName);
      const submittedStudentNames = studentsMarks.map(sm => sm.studentName);
      console.log('Submitted student names:', submittedStudentNames);
      
      const invalidStudents = studentsMarks.filter(sm => !batchStudentNames.includes(sm.studentName));
      console.log('Invalid students:', invalidStudents.map(s => s.studentName));
      
      if (invalidStudents.length > 0) {
        console.log('Returning 400 - invalid students found');
        return res.status(400).json({
          success: false,
          message: `Some students do not belong to batch ${batch}`,
          invalidStudents: invalidStudents.map(s => s.studentName)
        });
      }
    }

    const savedAssessments = [];
    const errors = [];

    for (const studentMark of studentsMarks) {
      try {
        const { studentName, rollNo, marks } = studentMark;
        console.log(`Processing student: ${studentName}, marks: ${marks}`);

        // Validate marks range
        if (marks < 0 || marks > 25) {
          console.log(`Invalid marks for ${studentName}: ${marks}`);
          errors.push(`Invalid marks for ${studentName}: ${marks}. Marks should be between 0-25`);
          continue;
        }

        // Validate student exists
        const studentExists = await Student.findOne({ studentName: studentName });
        if (!studentExists) {
          console.log(`Student ${studentName} not found in database`);
          errors.push(`Student ${studentName} not found in database`);
          continue;
        }
        console.log(`Student ${studentName} found in database`);

        // Use upsert to update existing or create new assessment
        const assessment = await Assessment.findOneAndUpdate(
          {
            experimentNumber: experimentNumber,
            studentName: studentName
          },
          {
            experimentName: experimentName,
            experimentNumber: experimentNumber,
            studentName: studentName,
            rollNo: rollNo || studentExists.rollNo || 'N/A',
            marks: parseInt(marks),
            // store context so defaulter and studentwise can load reliably
            program: program || '',
            className: classCtx || '',
            course: course || '',
            ciannId: ciannId || undefined,
            batch: batch || undefined
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        savedAssessments.push(assessment);
      } catch (error) {
        console.error(`Error saving assessment for student ${studentMark.studentName}:`, error);
        errors.push(`Error saving marks for ${studentMark.studentName}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some assessments could not be saved',
        errors,
        savedCount: savedAssessments.length,
        totalAttempted: studentsMarks.length
      });
    }

    res.json({
      success: true,
      message: `Successfully saved marks for ${savedAssessments.length} students`,
      savedCount: savedAssessments.length,
      batch: batch || 'All batches'
    });

  } catch (error) {
    console.error('Error saving assessments:', error);
    res.status(500).json({ success: false, message: 'Server error while saving marks' });
  }
});

// GET assessment history for a student
router.get('/student-history/:studentName', async (req, res) => {
  try {
    const { studentName } = req.params;
    const assessments = await Assessment.find({ studentName }).sort({ createdAt: -1 });
    
    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching student assessment history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET assessment report for experiment with batch filtering
router.get('/report', async (req, res) => {
  try {
    const { experimentNumber, batch } = req.query;
    
    let query = {};
    if (experimentNumber) query.experimentNumber = parseInt(experimentNumber);

    // If batch is specified, filter by batch students
    if (batch) {
      const batchStudents = await Student.find({ batch: batch }).select('studentName');
      const studentNames = batchStudents.map(student => student.studentName);
      
      if (studentNames.length === 0) {
        return res.json({ success: true, assessments: [], message: 'No students found for this batch' });
      }
      
      query.studentName = { $in: studentNames };
    }

    const assessments = await Assessment.find(query)
      .sort({ studentName: 1 });

    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessment report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET distinct ciannIds that have at least one saved assessment
router.get('/assessed-cianns', async (req, res) => {
  try {
    const distinctCiannIds = await Assessment.distinct('ciannId', {
      ciannId: { $exists: true, $ne: null }
    });
    res.json({ success: true, ciannIds: distinctCiannIds.filter(id => id != null) });
  } catch (error) {
    console.error('Error fetching assessed cianns:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET assessed experiments (experiments that have assessment records)
router.get('/assessed-experiments', async (req, res) => {
  try {
    const { batch, ciannId } = req.query;
    
    // First, get all students from the specified batch to filter assessments
    let batchStudents = [];
    const matchQuery = {};

    if (batch) {
      const Student = require('../models/Student');
      batchStudents = await Student.find({ batch: batch }).select('studentName');
      const studentNames = batchStudents.map(student => student.studentName);
      
      if (studentNames.length === 0) {
        return res.json({ success: true, experiments: [], ciannIds: [] });
      }
      
      matchQuery.studentName = { $in: studentNames };
    }

    if (ciannId) {
      // Support both numeric and string ciannId stored in assessments
      const numericId = Number(ciannId);
      if (!isNaN(numericId)) {
        matchQuery.$or = [{ ciannId: numericId }, { ciannId: ciannId }];
      } else {
        matchQuery.ciannId = ciannId;
      }
    }
    
    // Get distinct experiment numbers and names from assessments for this batch and CIANN
    const assessedExperiments = await Assessment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            experimentNumber: "$experimentNumber",
            experimentName: "$experimentName"
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$_id.experimentNumber",
          name: "$_id.experimentName"
        }
      },
      { $sort: { id: 1 } }
    ]);

    // Also return distinct ciannIds that have assessments (for CIANN filtering)
    let assessedCiannIds = [];
    if (!ciannId) {
      const ciannIdResults = await Assessment.distinct('ciannId', batch ? matchQuery : {});
      assessedCiannIds = ciannIdResults.filter(Boolean);
    }

    res.json({ success: true, experiments: assessedExperiments, ciannIds: assessedCiannIds });
  } catch (error) {
    console.error('Error fetching assessed experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET students by batch for assessment
router.get('/students-by-batch', async (req, res) => {
  try {
    const { batch, ciannId, division } = req.query;
    
    if (!batch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch parameter is required' 
      });
    }

    const resolvedDivision = await resolveDivisionFromQuery({ ciannId, division });
    const query = { batch: batch };

    if (resolvedDivision) {
      query.division = {
        $regex: new RegExp(`^${escapeRegex(resolvedDivision)}$`, 'i'),
      };
    }

    const students = await Student.find(query)
      .select('rollNo studentName batch')
      .lean();

    students.sort((a, b) => {
      const aRoll = String(a.rollNo || "").trim();
      const bRoll = String(b.rollNo || "").trim();
      return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (students.length === 0) {
      return res.json({ 
        success: true, 
        students: [], 
        message: 'No students found for this batch' 
      });
    }

    res.json({ 
      success: true, 
      students: students,
      count: students.length,
      batch: batch,
      division: resolvedDivision || null
    });
  } catch (error) {
    console.error('Error fetching students by batch:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all available batches
router.get('/batches', async (req, res) => {
  try {
    const { ciannId, division } = req.query;
    const resolvedDivision = await resolveDivisionFromQuery({ ciannId, division });
    const query = {};

    if (resolvedDivision) {
      query.division = {
        $regex: new RegExp(`^${escapeRegex(resolvedDivision)}$`, 'i'),
      };
    }

    const batches = await Student.distinct('batch', query);
    
    res.json({ 
      success: true, 
      batches: batches.sort(),
      count: batches.length,
      division: resolvedDivision || null
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET batch-wise assessment statistics
router.get('/batch-statistics', async (req, res) => {
  try {
    const { batch, experimentNumber } = req.query;
    
    if (!batch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch parameter is required' 
      });
    }

    // Get all students in the batch
    const batchStudents = await Student.find({ batch: batch }).select('studentName rollNo');
    const studentNames = batchStudents.map(s => s.studentName);
    
    if (studentNames.length === 0) {
      return res.json({ 
        success: true, 
        statistics: {
          batch: batch,
          totalStudents: 0,
          assessedStudents: 0,
          pendingStudents: 0,
          averageMarks: 0,
          experiments: []
        }
      });
    }

    let query = { studentName: { $in: studentNames } };
    if (experimentNumber) {
      query.experimentNumber = parseInt(experimentNumber);
    }

    // Get assessments for this batch
    const assessments = await Assessment.find(query);
    
    // Calculate statistics
    const totalStudents = batchStudents.length;
    const assessedStudentNames = [...new Set(assessments.map(a => a.studentName))];
    const assessedStudents = assessedStudentNames.length;
    const pendingStudents = totalStudents - assessedStudents;
    
    const totalMarks = assessments.reduce((sum, a) => sum + a.marks, 0);
    const averageMarks = assessments.length > 0 ? (totalMarks / assessments.length).toFixed(2) : 0;

    // Get experiment-wise statistics
    const experimentStats = await Assessment.aggregate([
      {
        $match: { studentName: { $in: studentNames } }
      },
      {
        $group: {
          _id: {
            experimentNumber: "$experimentNumber",
            experimentName: "$experimentName"
          },
          studentsAssessed: { $sum: 1 },
          averageMarks: { $avg: "$marks" },
          maxMarks: { $max: "$marks" },
          minMarks: { $min: "$marks" }
        }
      },
      {
        $project: {
          _id: 0,
          experimentNumber: "$_id.experimentNumber",
          experimentName: "$_id.experimentName",
          studentsAssessed: 1,
          averageMarks: { $round: ["$averageMarks", 2] },
          maxMarks: 1,
          minMarks: 1,
          pendingStudents: { $subtract: [totalStudents, "$studentsAssessed"] }
        }
      },
      {
        $sort: { experimentNumber: 1 }
      }
    ]);

    res.json({ 
      success: true, 
      statistics: {
        batch: batch,
        totalStudents: totalStudents,
        assessedStudents: assessedStudents,
        pendingStudents: pendingStudents,
        averageMarks: parseFloat(averageMarks),
        totalAssessments: assessments.length,
        experiments: experimentStats
      }
    });
  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET assessment data by batch for viewing
router.get('/batch/:batch', async (req, res) => {
  try {
    const { batch } = req.params;
    
    console.log('Fetching assessment data for batch:', batch);
    
    if (!batch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch parameter is required' 
      });
    }

    // Get all students in the batch
    const batchStudents = await Student.find({ batch: batch })
      .select('rollNo studentName batch')
      .lean();

    batchStudents.sort((a, b) => {
      const aRoll = String(a.rollNo || "").trim();
      const bRoll = String(b.rollNo || "").trim();
      return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    if (batchStudents.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'No students found for this batch' 
      });
    }

    const studentNames = batchStudents.map(s => s.studentName);
    console.log('Found students:', studentNames);

    // Get all assessments for students in this batch
    const assessments = await Assessment.find({ 
      studentName: { $in: studentNames } 
    }).sort({ studentName: 1, experimentNumber: 1 });

    console.log('Found assessments:', assessments.length);

    // Group assessments by student
    const studentAssessments = {};
    batchStudents.forEach(student => {
      studentAssessments[student.studentName] = {
        _id: student._id,
        rollNo: student.rollNo,
        studentName: student.studentName,
        assessments: {}
      };
    });

    // Fill in assessment data
    assessments.forEach(assessment => {
      if (studentAssessments[assessment.studentName]) {
        studentAssessments[assessment.studentName].assessments[assessment.experimentNumber] = {
          marks: assessment.marks,
          experimentName: assessment.experimentName,
          assessedDate: assessment.assessedDate
        };
      }
    });

    // Convert to array format
    const result = Object.values(studentAssessments);

    console.log('Returning data for', result.length, 'students');

    res.json({ 
      success: true, 
      data: result,
      batch: batch,
      totalStudents: result.length
    });
  } catch (error) {
    console.error('Error fetching batch assessment data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST assessment data by student names (division-based fetch)
router.post('/by-students', async (req, res) => {
  try {
    const { studentNames } = req.body;

    if (!Array.isArray(studentNames) || studentNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentNames array is required',
      });
    }

    const students = await Student.find({
      studentName: { $in: studentNames },
    })
      .select('rollNo studentName batch')
      .lean();

    students.sort((a, b) => {
      const aRoll = String(a.rollNo || "").trim();
      const bRoll = String(b.rollNo || "").trim();
      return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No students found for provided names',
      });
    }

    const assessments = await Assessment.find({
      studentName: { $in: studentNames },
    }).sort({ studentName: 1, experimentNumber: 1 });

    const studentAssessments = {};
    students.forEach((student) => {
      studentAssessments[student.studentName] = {
        _id: student._id,
        rollNo: student.rollNo,
        studentName: student.studentName,
        assessments: {},
      };
    });

    assessments.forEach((assessment) => {
      if (studentAssessments[assessment.studentName]) {
        studentAssessments[assessment.studentName].assessments[
          assessment.experimentNumber
        ] = {
          marks: assessment.marks,
          experimentName: assessment.experimentName,
          assessedDate: assessment.assessedDate,
        };
      }
    });

    const result = Object.values(studentAssessments);

    res.json({
      success: true,
      data: result,
      totalStudents: result.length,
    });
  } catch (error) {
    console.error('Error fetching assessment data by students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET assessment data for editing (experiment + student marks)
router.get('/edit-data/:experimentId', async (req, res) => {
  try {
    const { experimentId } = req.params;
    const { batch } = req.query;

    if (!experimentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Experiment ID is required' 
      });
    }

    let assessments;
    
    if (batch) {
      // Filter by batch: first get students from the batch, then filter assessments
      const Student = require('../models/Student');
      const batchStudents = await Student.find({ batch: batch }).select('studentName');
      const studentNames = batchStudents.map(student => student.studentName);
      
      if (studentNames.length === 0) {
        return res.json({ 
          success: false, 
          message: 'No students found for this batch' 
        });
      }
      
      assessments = await Assessment.find({ 
        experimentNumber: parseInt(experimentId),
        studentName: { $in: studentNames }
      }).sort({ studentName: 1 });
    } else {
      // Get all assessments for this experiment
      assessments = await Assessment.find({ 
        experimentNumber: parseInt(experimentId) 
      }).sort({ studentName: 1 });
    }

    if (assessments.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No assessment data found for this experiment and batch' 
      });
    }

    // Get experiment info from first assessment
    const experimentInfo = {
      id: assessments[0].experimentNumber,
      name: assessments[0].experimentName
    };

    // Transform assessments to student format
    const students = assessments.map(assessment => ({
      _id: assessment._id,
      rollNo: assessment.rollNo || 'N/A',
      studentName: assessment.studentName,
      marks: assessment.marks
    }));

    res.json({ 
      success: true, 
      experiment: experimentInfo,
      students: students
    });
  } catch (error) {
    console.error('Error fetching edit data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;