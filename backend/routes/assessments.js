const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Student = require('../models/Student');
const { resolveStudents } = require('../utils/studentHistoryHelper');
const Experiment = require('../models/Experiment');
const Ciann = require('../models/Ciann');

// Startup migration: Set ciannId to 0 for older assessments where it is missing,
// and drop the old unique index to support the new compound unique index.
const runMigration = async () => {
  try {
    const updateResult = await Assessment.updateMany(
      { ciannId: { $exists: false } },
      { $set: { ciannId: 0 } }
    );
    if (updateResult.modifiedCount > 0) {
      console.log(`Migration: Set ciannId to 0 for ${updateResult.modifiedCount} old assessments.`);
    }

    try {
      await Assessment.collection.dropIndex('experimentNumber_1_studentName_1');
      console.log('Successfully dropped old unique index: experimentNumber_1_studentName_1');
    } catch (dropErr) {
      console.log('Info: Old unique index experimentNumber_1_studentName_1 drop handled (it may not exist or is already dropped).');
    }
  } catch (err) {
    console.error('Error during startup migration/index setup:', err);
  }
};
runMigration();

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

// Helper function to robustly locate experiments document
const findExperiments = async (params) => {
  const { ciannId, program, className, course, semester } = params;
  
  let resolvedProgram = program;
  let resolvedCourse = course;
  let resolvedClass = className;
  let resolvedSemester = semester;
  
  if (ciannId) {
    const numericCiannId = parseInt(ciannId, 10);
    if (!Number.isNaN(numericCiannId)) {
      const ciann = await Ciann.findOne({ ciannId: numericCiannId });
      if (ciann) {
        resolvedProgram = ciann.department?.name || resolvedProgram;
        resolvedCourse = ciann.subject?.name || resolvedCourse;
        resolvedSemester = ciann.semester || resolvedSemester;
        resolvedClass = ciann.class || resolvedClass;
      }
    }
  }
  
  if (!resolvedProgram || !resolvedCourse) {
    return null;
  }
  
  const p = escapeRegex(resolvedProgram);
  const s = escapeRegex(resolvedCourse);
  
  let result = null;
  
  // 1) Match strict: program + course + className
  if (resolvedClass) {
    result = await Experiment.findOne({
      program: { $regex: new RegExp(`^${p}$`, 'i') },
      course: { $regex: new RegExp(`^${s}$`, 'i') },
      className: { $regex: new RegExp(`^${escapeRegex(resolvedClass)}$`, 'i') }
    });
  }
  
  // 2) If not found, try matching by resolvedSemester if available
  if (!result && resolvedSemester) {
    result = await Experiment.findOne({
      program: { $regex: new RegExp(`^${p}$`, 'i') },
      course: { $regex: new RegExp(`^${s}$`, 'i') },
      className: { $regex: new RegExp(`^Sem(ester)?\\s*${escapeRegex(resolvedSemester)}$`, 'i') }
    });
  }
  
  // 3) Try extracting semester from resolvedClass (e.g. "IF4I" or "Sem 4" or "4")
  if (!result && resolvedClass) {
    const semNum = String(resolvedClass).match(/\d+/)?.[0];
    if (semNum) {
      result = await Experiment.findOne({
        program: { $regex: new RegExp(`^${p}$`, 'i') },
        course: { $regex: new RegExp(`^${s}$`, 'i') },
        className: { $regex: new RegExp(`^Sem(ester)?\\s*${semNum}$`, 'i') }
      });
    }
  }
  
  // 4) Fallback to program + course only
  if (!result) {
    result = await Experiment.findOne({
      program: { $regex: new RegExp(`^${p}$`, 'i') },
      course: { $regex: new RegExp(`^${s}$`, 'i') }
    });
  }
  
  return result;
};

// GET experiments by subject details (GET version with query parameters)
router.get('/get-experiments', async (req, res) => {
  try {
    const { ciannId, program, className, course, semester } = req.query;
    
    console.log('GET: Searching for experiments with:', { ciannId, program, className, course, semester });
    
    const result = await findExperiments({ ciannId, program, className, course, semester });
    console.log('GET: Database result:', result ? 'Found' : 'Not Found');
    
    res.json({ 
      success: true, 
      experiments: result ? result.experiments : [],
      message: result ? 'Experiments found' : 'No experiments found'
    });
  } catch (error) {
    console.error('GET: Error fetching experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
 
// POST experiments by subject details
router.post('/get-experiments', async (req, res) => {
  try {
    const { ciannId, program, className, course, semester } = req.body;
    
    console.log('Searching for experiments with:', { ciannId, program, className, course, semester });
    
    const result = await findExperiments({ ciannId, program, className, course, semester });
    console.log('Database result:', result ? 'Found' : 'Not Found');
    
    res.json({ 
      success: true, 
      experiments: result ? result.experiments : [],
      message: result ? 'Experiments found' : 'No experiments found'
    });
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

        const resolvedCiannId = ciannId ? Number(ciannId) : 0;

        // If marks is empty string, null, or undefined, delete the assessment record if it exists
        if (marks === "" || marks === null || marks === undefined) {
          await Assessment.deleteOne({
            experimentNumber: experimentNumber,
            studentName: studentName,
            ciannId: resolvedCiannId
          });
          continue;
        }

        // Validate marks range
        const parsedMarks = parseInt(marks, 10);
        if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 25) {
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
            studentName: studentName,
            ciannId: resolvedCiannId
          },
          {
            experimentName: experimentName,
            experimentNumber: experimentNumber,
            studentName: studentName,
            rollNo: rollNo || studentExists.rollNo || 'N/A',
            marks: parsedMarks,
            // store context so defaulter and studentwise can load reliably
            program: program || '',
            className: classCtx || '',
            course: course || '',
            ciannId: resolvedCiannId,
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

// GET assessed experiments (experiments that have assessment records)
router.get('/assessed-experiments', async (req, res) => {
  try {
    const { batch, ciannId } = req.query;
    
    let matchStage = {
      marks: { $gt: 0 } // Ignore fake/default assessments with 0 marks
    };

    // 1. Resolve batch studentNames if batch is provided
    if (batch) {
      const Student = require('../models/Student');
      const batchStudents = await Student.find({ batch: batch }).select('studentName');
      const studentNames = batchStudents.map(student => student.studentName);
      if (studentNames.length === 0) {
        return res.json({ success: true, experiments: [] });
      }
      matchStage.studentName = { $in: studentNames };
    }

    // 2. Filter by ciannId or fallback subject/class context
    if (ciannId) {
      const numericCiannId = parseInt(ciannId, 10);
      const ciann = await Ciann.findOne({ ciannId: numericCiannId });
      if (ciann) {
        matchStage.$or = [
          { ciannId: numericCiannId },
          {
            course: { $regex: new RegExp(`^${escapeRegex(ciann.subject?.name)}$`, 'i') },
            className: { $regex: new RegExp(`^${escapeRegex(ciann.class)}$`, 'i') }
          }
        ];
      } else {
        matchStage.ciannId = numericCiannId;
      }
    }

    // Get distinct experiment numbers and names from assessments
    const assessedExperiments = await Assessment.aggregate([
      {
        $match: matchStage
      },
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
      {
        $sort: { id: 1 }
      }
    ]);

    res.json({ success: true, experiments: assessedExperiments });
  } catch (error) {
    console.error('Error fetching assessed experiments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all assessed experiments for a CIAAN (grouped by batch)
router.get('/all-assessed-experiments', async (req, res) => {
  try {
    const { ciannId } = req.query;
    if (!ciannId) {
      return res.status(400).json({ success: false, message: 'ciannId is required' });
    }

    const numericCiannId = parseInt(ciannId, 10);
    if (Number.isNaN(numericCiannId)) {
      return res.status(400).json({ success: false, message: 'Invalid ciannId' });
    }

    const assessments = await Assessment.aggregate([
      {
        $match: { ciannId: numericCiannId, marks: { $gt: 0 } }
      },
      {
        $group: {
          _id: {
            batch: "$batch",
            experimentNumber: "$experimentNumber",
            experimentName: "$experimentName"
          },
          studentCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          batch: { $ifNull: ["$_id.batch", "All"] },
          id: "$_id.experimentNumber",
          name: "$_id.experimentName",
          studentCount: "$studentCount"
        }
      },
      {
        $sort: { batch: 1, id: 1 }
      }
    ]);

    res.json({ success: true, experiments: assessments });
  } catch (error) {
    console.error('Error fetching all assessed experiments:', error);
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

    if (ciannId) {
      const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
      if (ciann) {
        if (ciann.academicYear) {
          query.academicYear = ciann.academicYear;
        }
        if (ciann.department && (ciann.department._id || ciann.department.id)) {
          query.departmentId = ciann.department._id || ciann.department.id;
        }
      }
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

    let query = { studentName: { $in: studentNames }, marks: { $gt: 0 } };
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
        $match: { studentName: { $in: studentNames }, marks: { $gt: 0 } }
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

// GET batch-wise assessment statistics (URL format: /statistics/:batch)
router.get('/statistics/:batch', async (req, res) => {
  try {
    const { batch } = req.params;
    const { ciannId } = req.query; // optional ciannId
    
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
          totalAssessments: 0,
          totalStudentAssessments: 0,
          averageMarks: 0,
          experimentsAssessed: []
        }
      });
    }

    let query = { studentName: { $in: studentNames }, marks: { $gt: 0 } };
    
    // Filter by ciannId if provided to make it subject-specific
    if (ciannId) {
      const numericCiannId = parseInt(ciannId, 10);
      if (!isNaN(numericCiannId)) {
        query.ciannId = numericCiannId;
      }
    }

    // Get assessments for this batch
    const assessments = await Assessment.find(query);
    
    // Calculate statistics
    const assessedStudentNames = [...new Set(assessments.map(a => a.studentName))];
    const assessedStudentsCount = assessedStudentNames.length;
    
    const totalMarks = assessments.reduce((sum, a) => sum + a.marks, 0);
    const averageMarks = assessments.length > 0 ? (totalMarks / assessments.length).toFixed(2) : 0;

    // Get experiment-wise statistics
    const matchStage = { studentName: { $in: studentNames }, marks: { $gt: 0 } };
    if (ciannId) {
      const numericCiannId = parseInt(ciannId, 10);
      if (!isNaN(numericCiannId)) {
        matchStage.ciannId = numericCiannId;
      }
    }

    const experimentStats = await Assessment.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            experimentNumber: "$experimentNumber",
            experimentName: "$experimentName"
          },
          studentsCount: { $sum: 1 },
          averageMarks: { $avg: "$marks" }
        }
      },
      {
        $project: {
          _id: 0,
          experimentId: "$_id.experimentNumber",
          experimentName: "$_id.experimentName",
          studentsCount: 1,
          averageMarks: { $round: ["$averageMarks", 2] }
        }
      },
      {
        $sort: { experimentId: 1 }
      }
    ]);

    res.json({ 
      success: true, 
      statistics: {
        batch: batch,
        totalAssessments: assessments.length,
        totalStudentAssessments: assessedStudentsCount,
        averageMarks: parseFloat(averageMarks),
        experimentsAssessed: experimentStats
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
    const { ciannId } = req.query;
    
    console.log('Fetching assessment data for batch:', batch, 'ciannId:', ciannId);
    
    if (!batch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch parameter is required' 
      });
    }

    // Get all students in the batch/division/academic year/department
    let batchStudents = [];
    if (batch) {
      const resolvedDivision = await resolveDivisionFromQuery({ ciannId });
      const query = { batch: batch };
      if (resolvedDivision) {
        query.division = {
          $regex: new RegExp(`^${escapeRegex(resolvedDivision)}$`, 'i'),
        };
      }
      if (ciannId) {
        const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
        if (ciann) {
          if (ciann.academicYear) {
            query.academicYear = ciann.academicYear;
          }
          if (ciann.department && (ciann.department._id || ciann.department.id)) {
            query.departmentId = ciann.department._id || ciann.department.id;
          }
        }
      }
      batchStudents = await Student.find(query)
        .select('rollNo studentName batch')
        .lean();
    }

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

    const query = { 
      studentName: { $in: studentNames } 
    };

    if (ciannId) {
      const numericCiannId = parseInt(ciannId, 10);
      const ciann = await Ciann.findOne({ ciannId: numericCiannId });
      if (ciann) {
        query.$or = [
          { ciannId: numericCiannId },
          {
            course: { $regex: new RegExp(`^${escapeRegex(ciann.subject?.name)}$`, 'i') },
            className: { $regex: new RegExp(`^${escapeRegex(ciann.class)}$`, 'i') }
          }
        ];
      } else {
        query.ciannId = numericCiannId;
      }
    }

    // Get all assessments for students in this batch
    const assessments = await Assessment.find(query).sort({ studentName: 1, experimentNumber: 1 });

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
    const { batch, ciannId } = req.query;

    if (!experimentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Experiment ID is required' 
      });
    }

    // 1. Fetch all students in the batch
    let batchStudents = [];
    if (batch) {
      const resolvedDivision = await resolveDivisionFromQuery({ ciannId });
      const query = { batch: batch };
      if (resolvedDivision) {
        query.division = {
          $regex: new RegExp(`^${escapeRegex(resolvedDivision)}$`, 'i'),
        };
      }
      if (ciannId) {
        const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
        if (ciann) {
          if (ciann.academicYear) {
            query.academicYear = ciann.academicYear;
          }
          if (ciann.department && (ciann.department._id || ciann.department.id)) {
            query.departmentId = ciann.department._id || ciann.department.id;
          }
        }
      }
      batchStudents = await Student.find(query).select('studentName rollNo').lean();
    }

    if (batchStudents.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No students found for this batch' 
      });
    }

    // 2. Fetch existing assessments for this batch and experiment
    const studentNames = batchStudents.map(student => student.studentName);
    const query = { 
      experimentNumber: parseInt(experimentId),
      studentName: { $in: studentNames }
    };
    
    if (ciannId) {
      const numericCiannId = parseInt(ciannId, 10);
      const ciann = await Ciann.findOne({ ciannId: numericCiannId });
      if (ciann) {
        query.$or = [
          { ciannId: numericCiannId },
          {
            course: { $regex: new RegExp(`^${escapeRegex(ciann.subject?.name)}$`, 'i') },
            className: { $regex: new RegExp(`^${escapeRegex(ciann.class)}$`, 'i') }
          }
        ];
      } else {
        query.ciannId = numericCiannId;
      }
    }

    const assessments = await Assessment.find(query);

    // 3. Map assessments and experiment info
    const assessmentMap = {};
    const experimentNameMap = {};
    assessments.forEach(a => {
      assessmentMap[a.studentName] = a.marks;
      if (a.experimentName) {
        experimentNameMap[a.experimentName] = (experimentNameMap[a.experimentName] || 0) + 1;
      }
    });

    let expName = `Experiment ${experimentId}`;
    const nameEntries = Object.entries(experimentNameMap);
    if (nameEntries.length > 0) {
      nameEntries.sort((a, b) => b[1] - a[1]);
      expName = nameEntries[0][0];
    } else {
      if (ciannId) {
        const ciann = await Ciann.findOne({ ciannId: Number(ciannId) });
        if (ciann && ciann.subject?.code) {
          const expDoc = await Experiment.findOne({ 
            courseCode: ciann.subject.code,
            practicalNo: parseInt(experimentId)
          });
          if (expDoc && expDoc.practicalName) {
            expName = expDoc.practicalName;
          }
        }
      }
    }

    // 4. Build students list for edit page containing all students in the batch
    const studentsList = batchStudents.map(student => {
      const existingMark = assessmentMap[student.studentName];
      return {
        _id: student._id,
        rollNo: student.rollNo || 'N/A',
        studentName: student.studentName,
        marks: existingMark !== undefined ? existingMark : '' // Blank if not assessed
      };
    });

    // 5. Sort students strictly by roll number
    studentsList.sort((a, b) => {
      const aRoll = String(a.rollNo || "").trim();
      const bRoll = String(b.rollNo || "").trim();
      return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: 'base' });
    });

    res.json({ 
      success: true, 
      experiment: {
        id: parseInt(experimentId),
        name: expName
      },
      students: studentsList
    });
  } catch (error) {
    console.error('Error fetching edit data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;