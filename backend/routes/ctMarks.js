const express = require('express');
const router = express.Router();
const CTMarks = require('../models/CTMarks');
const Ciaan = require('../models/Ciann');
const Student = require('../models/Student');
const checkCiaanFreeze = require('../middleware/checkFreeze');

// @route   GET /api/ct-marks/:CiaanId
// @desc    Get all CT marks for a specific Ciaan ID
// @access  Public
router.get('/:CiaanId', async (req, res) => {
  try {
    const CiaanId = parseInt(req.params.CiaanId, 10);

    if (isNaN(CiaanId)) {
      return res.status(400).json({ message: 'Invalid CIAAN ID format' });
    }

    const ctMarks = await CTMarks.find({ CiaanId }).sort({ ctNumber: 1, studentName: 1 });

    res.json({
      success: true,
      data: ctMarks,
      count: ctMarks.length
    });
  } catch (error) {
    console.error('Error fetching CT marks:', error);
    res.status(500).json({ message: 'Server error while fetching CT marks' });
  }
});

// @route   GET /api/ct-marks/:CiaanId/ct/:ctNumber
// @desc    Get CT marks for a specific CT number and Ciaan ID
// @access  Public
router.get('/:CiaanId/ct/:ctNumber', async (req, res) => {
  try {
    const CiaanId = parseInt(req.params.CiaanId, 10);
    const ctNumber = parseInt(req.params.ctNumber, 10);

    if (isNaN(CiaanId) || isNaN(ctNumber)) {
      return res.status(400).json({ message: 'Invalid CIAAN ID or CT Number format' });
    }

    const ctMarks = await CTMarks.find({ CiaanId, ctNumber }).sort({ studentName: 1 });

    res.json({
      success: true,
      data: ctMarks,
      count: ctMarks.length,
      ctNumber
    });
  } catch (error) {
    console.error('Error fetching CT marks for specific CT:', error);
    res.status(500).json({ message: 'Server error while fetching CT marks' });
  }
});

// @route   POST /api/ct-marks
// @desc    Create new CT marks entry
// @access  Public
router.post('/', checkCiaanFreeze, async (req, res) => {
  try {
    const {
      ctName,
      ctNumber,
      studentName,
      rollNo,
      marks,
      totalMarks,
      CiaanId,
      program,
      className,
      course,
      batch,
      division,
      ctDate,
      subject,
      subjectCode,
      markedBy,
      remarks
    } = req.body;

    // Validate required fields
    if (!ctName || !ctNumber || !studentName || marks === undefined || !CiaanId) {
      return res.status(400).json({
        message: 'CT Name, CT Number, Student Name, Marks, and CIAAN ID are required'
      });
    }

    // Validate marks range
    const maxMarks = totalMarks || 20;
    if (marks < 0 || marks > maxMarks) {
      return res.status(400).json({
        message: `Marks should be between 0 and ${maxMarks}`
      });
    }

    // Check if Ciaan exists
    const ciaanDoc = await Ciaan.findOne({ CiaanId });
    if (!ciaanDoc) {
      return res.status(400).json({ message: 'Invalid CIAAN ID. No matching CIAAN found.' });
    }

    // Create new CT marks entry
    const newCTMarks = new CTMarks({
      ctName,
      ctNumber,
      studentName,
      rollNo,
      marks,
      totalMarks: totalMarks || 20,
      CiaanId,
      program,
      className,
      course,
      batch,
      division,
      ctDate,
      subject: subject || ciaanDoc.subject?.name,
      subjectCode: subjectCode || ciaanDoc.subject?.code,
      markedBy,
      remarks
    });

    await newCTMarks.save();

    res.status(201).json({
      success: true,
      message: 'CT marks saved successfully',
      data: newCTMarks
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        message: 'CT marks already exist for this student and CT number'
      });
    }
    console.error('Error saving CT marks:', error);
    res.status(500).json({ message: 'Server error while saving CT marks' });
  }
});

// @route   PUT /api/ct-marks/:id
// @desc    Update CT marks entry
// @access  Public
router.put('/:id', checkCiaanFreeze, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate marks if provided
    if (updateData.marks !== undefined) {
      const maxMarks = updateData.totalMarks || 20;
      if (updateData.marks < 0 || updateData.marks > maxMarks) {
        return res.status(400).json({
          message: `Marks should be between 0 and ${maxMarks}`
        });
      }
    }

    const updatedCTMarks = await CTMarks.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCTMarks) {
      return res.status(404).json({ message: 'CT marks not found' });
    }

    res.json({
      success: true,
      message: 'CT marks updated successfully',
      data: updatedCTMarks
    });
  } catch (error) {
    console.error('Error updating CT marks:', error);
    res.status(500).json({ message: 'Server error while updating CT marks' });
  }
});

// @route   DELETE /api/ct-marks/:id
// @desc    Delete CT marks entry
// @access  Public
router.delete('/:id', checkCiaanFreeze, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCTMarks = await CTMarks.findByIdAndDelete(id);

    if (!deletedCTMarks) {
      return res.status(404).json({ message: 'CT marks not found' });
    }

    res.json({
      success: true,
      message: 'CT marks deleted successfully',
      data: deletedCTMarks
    });
  } catch (error) {
    console.error('Error deleting CT marks:', error);
    res.status(500).json({ message: 'Server error while deleting CT marks' });
  }
});

// @route   GET /api/ct-marks/:CiaanId/statistics
// @desc    Get CT statistics for a Ciaan ID
// @access  Public
router.get('/:CiaanId/statistics', async (req, res) => {
  try {
    const CiaanId = parseInt(req.params.CiaanId, 10);

    if (isNaN(CiaanId)) {
      return res.status(400).json({ message: 'Invalid CIAAN ID format' });
    }

    const ctMarks = await CTMarks.find({ CiaanId });

    if (ctMarks.length === 0) {
      return res.json({
        success: true,
        statistics: {
          totalStudents: 0,
          totalCTs: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          ctBreakdown: []
        }
      });
    }

    // Calculate statistics
    const uniqueStudents = [...new Set(ctMarks.map(mark => mark.studentName))];
    const uniqueCTs = [...new Set(ctMarks.map(mark => mark.ctNumber))];

    const allMarks = ctMarks.map(mark => mark.marks);
    const averageScore = allMarks.reduce((sum, mark) => sum + mark, 0) / allMarks.length;
    const highestScore = Math.max(...allMarks);
    const lowestScore = Math.min(...allMarks);

    // CT-wise breakdown
    const ctBreakdown = uniqueCTs.map(ctNum => {
      const ctSpecificMarks = ctMarks.filter(mark => mark.ctNumber === ctNum);
      const ctMarksValues = ctSpecificMarks.map(mark => mark.marks);

      return {
        ctNumber: ctNum,
        studentsAppeared: ctSpecificMarks.length,
        averageScore: ctMarksValues.length > 0 ?
          ctMarksValues.reduce((sum, mark) => sum + mark, 0) / ctMarksValues.length : 0,
        highestScore: ctMarksValues.length > 0 ? Math.max(...ctMarksValues) : 0,
        lowestScore: ctMarksValues.length > 0 ? Math.min(...ctMarksValues) : 0
      };
    });

    res.json({
      success: true,
      statistics: {
        totalStudents: uniqueStudents.length,
        totalCTs: uniqueCTs.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        ctBreakdown
      }
    });
  } catch (error) {
    console.error('Error calculating CT statistics:', error);
    res.status(500).json({ message: 'Server error while calculating statistics' });
  }
});

module.exports = router;