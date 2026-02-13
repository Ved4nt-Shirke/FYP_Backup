const express = require('express');
const router = express.Router();
const TeachingPlan = require('../models/TeachingPlan');
const TheoryAttendance = require('../models/TheoryAttendance');
const PracticalAttendance = require('../models/PracticalAttendance');
const TutorialAttendance = require('../models/TutorialAttendance');
const ExtraAttendance = require('../models/ExtraAttendance');
const ExtraPract = require('../models/ExtraPract');
const Student = require('../models/Student');

// Helper function to calculate percentage
const calculatePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
};

router.get('/:ciannId', async (req, res) => {
  try {
    const ciannId = parseInt(req.params.ciannId);
    if (isNaN(ciannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }

    console.log(`Fetching summary for CIANN ID: ${ciannId}`);

    // Get total students for this CIANN from attendance records
    const allAttendanceRecords = await TheoryAttendance.find({ ciannId });
    let totalStudentsInClass = 0;
    
    if (allAttendanceRecords.length > 0) {
      // Get the number of students from the first attendance record
      totalStudentsInClass = allAttendanceRecords[0].students ? allAttendanceRecords[0].students.length : 0;
    }
    
    const studentsPerBatch = Math.ceil(totalStudentsInClass / 3); // Assuming 3 batches

    console.log(`Total students: ${totalStudentsInClass}, Students per batch: ${studentsPerBatch}`);

    // --- 1. Theory Calculations ---
    const theoryAttendances = await TheoryAttendance.find({ ciannId });
    const extraAttendances = await ExtraAttendance.find({ ciannId });

    console.log(`Found ${theoryAttendances.length} theory attendances:`, theoryAttendances.map(t => ({ date: t.date, topic: t.topic })));
    console.log(`Found ${extraAttendances.length} extra attendances:`, extraAttendances.map(e => ({ date: e.date, topic: e.topic })));

    const lecturesEngaged = theoryAttendances.length;
    const extraLecturesEngaged = extraAttendances.length;
    const totalTheoryEngaged = lecturesEngaged + extraLecturesEngaged;

    const attendanceTheoryLectures = theoryAttendances.reduce((sum, t) => {
      const presentCount = t.students ? t.students.filter(s => s.status === 'Present').length : 0;
      return sum + presentCount;
    }, 0);

    const attendanceExtraLectures = extraAttendances.reduce((sum, e) => {
      const presentCount = e.students ? e.students.filter(s => s.attendance === 'Present').length : 0;
      return sum + presentCount;
    }, 0);

    const totalTheoryAttendance = attendanceTheoryLectures + attendanceExtraLectures;
    const overallTheoryAttendance = calculatePercentage(totalTheoryAttendance, totalTheoryEngaged * totalStudentsInClass);
    
    // Calculate individual percentages for theory and extra lectures
    const theoryLecturesPercentage = calculatePercentage(attendanceTheoryLectures, lecturesEngaged * totalStudentsInClass);
    const extraLecturesPercentage = calculatePercentage(attendanceExtraLectures, extraLecturesEngaged * totalStudentsInClass);
    
    console.log(`Theory calculations:`, {
      lecturesEngaged,
      attendanceTheoryLectures,
      theoryLecturesPercentage,
      extraLecturesEngaged,
      attendanceExtraLectures,
      extraLecturesPercentage,
      totalStudentsInClass,
      theoryDenominator: lecturesEngaged * totalStudentsInClass,
      extraDenominator: extraLecturesEngaged * totalStudentsInClass
    });

    const theorySummary = {
      lecturesEngaged,
      attendanceTheoryLectures,
      theoryLecturesPercentage,
      extraLecturesEngaged,
      attendanceExtraLectures,
      extraLecturesPercentage,
      overallTheoryAttendance
    };

    // --- 2. Practical Calculations ---
    const practicals = await PracticalAttendance.find({ ciannId });
    const extraPracticals = await ExtraPract.find({ ciannId });

    console.log(`Found ${practicals.length} regular practicals and ${extraPracticals.length} extra practicals`);

    const processBatch = (batchId, batchPracticals) => {
      const practicalEngaged = batchPracticals.length;
      let attendance = 0;
      let totalPossibleAttendance = 0;
      
      batchPracticals.forEach(p => {
        if (p.students && p.students.length > 0) {
          const presentCount = p.students.filter(s => s.status === 'Present').length;
          attendance += presentCount;
          totalPossibleAttendance += p.students.length; // Use actual number of students in this session
        }
      });
      
      const percentage = calculatePercentage(attendance, totalPossibleAttendance);
      return { practicalEngaged, attendance, percentage };
    };

    const processExtraBatch = (batchId, batchPracticals) => {
      const engaged = batchPracticals.length;
      let attendance = 0;
      let totalPossibleAttendance = 0;
      
      batchPracticals.forEach(p => {
        if (p.students && p.students.length > 0) {
          // ExtraPract uses 'attendance' field instead of 'status'
          const presentCount = p.students.filter(s => s.attendance === 'Present').length;
          attendance += presentCount;
          totalPossibleAttendance += p.students.length; // Use actual number of students in this session
        }
      });
      
      const percentage = calculatePercentage(attendance, totalPossibleAttendance);
      return { engaged, attendance, percentage };
    };

    // Group practicals by batch
    const b1Practicals = practicals.filter(p => p.batch === 'B1');
    const b2Practicals = practicals.filter(p => p.batch === 'B2');
    const b3Practicals = practicals.filter(p => p.batch === 'B3');
    const extraB1 = extraPracticals.filter(p => p.batch === 'B1');
    const extraB2 = extraPracticals.filter(p => p.batch === 'B2');
    const extraB3 = extraPracticals.filter(p => p.batch === 'B3');

    const practicalSummary = {
      batch1: processBatch('B1', b1Practicals),
      batch2: processBatch('B2', b2Practicals),
      batch3: processBatch('B3', b3Practicals),
      extraPracticals: {
        batch1: processExtraBatch('B1', extraB1),
        batch2: processExtraBatch('B2', extraB2),
        batch3: processExtraBatch('B3', extraB3)
      },
      overall: {
        engaged: practicals.length + extraPracticals.length,
        attendance: practicals.reduce((sum, p) => {
          const presentCount = p.students ? p.students.filter(s => s.status === 'Present').length : 0;
          return sum + presentCount;
        }, 0) + extraPracticals.reduce((sum, p) => {
          // ExtraPract uses 'attendance' field instead of 'status'
          const presentCount = p.students ? p.students.filter(s => s.attendance === 'Present').length : 0;
          return sum + presentCount;
        }, 0),
        percentage: 0
      }
    };

    // Calculate overall practical percentage correctly
    let totalPossiblePracticalAttendance = 0;
    
    // Calculate total possible attendance from all practical sessions
    practicals.forEach(p => {
      if (p.students && p.students.length > 0) {
        totalPossiblePracticalAttendance += p.students.length;
      }
    });
    
    extraPracticals.forEach(p => {
      if (p.students && p.students.length > 0) {
        totalPossiblePracticalAttendance += p.students.length;
      }
    });
    
    practicalSummary.overall.percentage = calculatePercentage(practicalSummary.overall.attendance, totalPossiblePracticalAttendance);
    
    console.log(`Practical calculations:`, {
      batch1: practicalSummary.batch1,
      batch2: practicalSummary.batch2,
      batch3: practicalSummary.batch3,
      overall: {
        attendance: practicalSummary.overall.attendance,
        totalPossible: totalPossiblePracticalAttendance,
        percentage: practicalSummary.overall.percentage
      }
    });

    // --- 3. Tutorial Calculations ---
    const tutorials = await TutorialAttendance.find({ ciannId });
    console.log(`Found ${tutorials.length} tutorials`);

    const tutorialsEngaged = tutorials.length;
    const tutorialAttendance = tutorials.reduce((sum, t) => {
      const presentCount = t.students ? t.students.filter(s => s.status === 'Present').length : 0;
      return sum + presentCount;
    }, 0);
    const tutorialPercentage = calculatePercentage(tutorialAttendance, tutorialsEngaged * totalStudentsInClass);
    const tutorialSummary = { tutorialsEngaged, attendance: tutorialAttendance, percentage: tutorialPercentage };

    // --- Debug logging ---
    console.log('Theory Summary:', JSON.stringify(theorySummary, null, 2));
    console.log('Practical Summary:', JSON.stringify(practicalSummary, null, 2));
    console.log('Tutorial Summary:', JSON.stringify(tutorialSummary, null, 2));

    // --- Final Response ---
    res.json({ theory: theorySummary, practical: practicalSummary, tutorial: tutorialSummary });

  } catch (error) {
    console.error('Error in summary route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
