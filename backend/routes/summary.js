const express = require('express');
const router = express.Router();
const TeachingPlan = require('../models/TeachingPlan');
const TheoryAttendance = require('../models/TheoryAttendance');
const PracticalAttendance = require('../models/PracticalAttendance');
const TutorialAttendance = require('../models/TutorialAttendance');
const ExtraAttendance = require('../models/ExtraAttendance');
const ExtraPract = require('../models/ExtraPract');
const Student = require('../models/Student');
const Ciaan = require('../models/Ciann');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper function to calculate percentage
const calculatePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
};

router.get('/:CiaanId', async (req, res) => {
  try {
    const CiaanId = parseInt(req.params.CiaanId);
    if (isNaN(CiaanId)) {
      return res.status(400).json({ message: 'Invalid CiaanId format' });
    }

    console.log(`Fetching summary for Ciaan ID: ${CiaanId}`);

    const ciaanDoc = await Ciaan.findOne({ CiaanId }).select('division');
    const CiaanDivision = String(ciaanDoc?.division || '').trim();

    const divisionStudents = CiaanDivision
      ? await Student.find({
        division: { $regex: new RegExp(`^${escapeRegex(CiaanDivision)}$`, 'i') },
      }).select('rollNo studentName')
      : [];

    const allowedRollNos = new Set(
      divisionStudents
        .map((student) => String(student.rollNo || '').trim())
        .filter(Boolean),
    );
    const allowedStudentNames = new Set(
      divisionStudents
        .map((student) => String(student.studentName || '').trim().toLowerCase())
        .filter(Boolean),
    );

    const isAllowedStudent = (entry = {}) => {
      if (!CiaanDivision) return true;

      const roll = String(entry.rollNo || entry.rollId || '').trim();
      const name = String(entry.studentName || entry.name || '').trim().toLowerCase();

      if (roll && allowedRollNos.has(roll)) return true;
      if (name && allowedStudentNames.has(name)) return true;
      return false;
    };

    // Get total students for this Ciaan from division context
    const allAttendanceRecords = await TheoryAttendance.find({ CiaanId });
    let totalStudentsInClass = divisionStudents.length;

    if (totalStudentsInClass === 0 && allAttendanceRecords.length > 0) {
      // Get the number of students from the first attendance record
      const firstStudents = allAttendanceRecords[0].students || [];
      totalStudentsInClass = firstStudents.filter(isAllowedStudent).length;
    }

    const studentsPerBatch = Math.ceil(totalStudentsInClass / 3); // Assuming 3 batches

    console.log(`Total students: ${totalStudentsInClass}, Students per batch: ${studentsPerBatch}`);

    // --- 1. Theory Calculations ---
    const theoryAttendances = await TheoryAttendance.find({ CiaanId });
    const extraAttendances = await ExtraAttendance.find({ CiaanId });

    console.log(`Found ${theoryAttendances.length} theory attendances:`, theoryAttendances.map(t => ({ date: t.date, topic: t.topic })));
    console.log(`Found ${extraAttendances.length} extra attendances:`, extraAttendances.map(e => ({ date: e.date, topic: e.topic })));

    const lecturesEngaged = theoryAttendances.length;
    const extraLecturesEngaged = extraAttendances.length;
    const totalTheoryEngaged = lecturesEngaged + extraLecturesEngaged;

    const attendanceTheoryLectures = theoryAttendances.reduce((sum, t) => {
      const presentCount = t.students
        ? t.students.filter((s) => isAllowedStudent(s) && s.status === 'Present').length
        : 0;
      return sum + presentCount;
    }, 0);

    const attendanceExtraLectures = extraAttendances.reduce((sum, e) => {
      const presentCount = e.students
        ? e.students.filter((s) => isAllowedStudent(s) && s.attendance === 'Present').length
        : 0;
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
    const practicals = await PracticalAttendance.find({ CiaanId });
    const extraPracticals = await ExtraPract.find({ CiaanId });

    console.log(`Found ${practicals.length} regular practicals and ${extraPracticals.length} extra practicals`);

    const processBatch = (batchId, batchPracticals) => {
      const practicalEngaged = batchPracticals.length;
      let attendance = 0;
      let totalPossibleAttendance = 0;

      batchPracticals.forEach(p => {
        if (p.students && p.students.length > 0) {
          const allowedStudents = p.students.filter(isAllowedStudent);
          const presentCount = allowedStudents.filter(s => s.status === 'Present').length;
          attendance += presentCount;
          totalPossibleAttendance += allowedStudents.length; // Use filtered students for this session
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
          const allowedStudents = p.students.filter(isAllowedStudent);
          const presentCount = allowedStudents.filter(s => s.attendance === 'Present').length;
          attendance += presentCount;
          totalPossibleAttendance += allowedStudents.length; // Use filtered students for this session
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
          const presentCount = p.students
            ? p.students.filter((s) => isAllowedStudent(s) && s.status === 'Present').length
            : 0;
          return sum + presentCount;
        }, 0) + extraPracticals.reduce((sum, p) => {
          // ExtraPract uses 'attendance' field instead of 'status'
          const presentCount = p.students
            ? p.students.filter((s) => isAllowedStudent(s) && s.attendance === 'Present').length
            : 0;
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
        totalPossiblePracticalAttendance += p.students.filter(isAllowedStudent).length;
      }
    });

    extraPracticals.forEach(p => {
      if (p.students && p.students.length > 0) {
        totalPossiblePracticalAttendance += p.students.filter(isAllowedStudent).length;
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
    const tutorials = await TutorialAttendance.find({ CiaanId });
    console.log(`Found ${tutorials.length} tutorials`);

    const tutorialsEngaged = tutorials.length;
    const tutorialAttendance = tutorials.reduce((sum, t) => {
      const presentCount = t.students
        ? t.students.filter((s) => {
          const allowed = isAllowedStudent({
            rollId: s.rollId,
            name: s.name,
          });
          const status = String(s.status || s.attendance || '').toLowerCase();
          return allowed && status === 'present';
        }).length
        : 0;
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
