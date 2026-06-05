const express = require('express');
const router = express.Router();
const TeachingPlan = require('../models/TeachingPlan');
const TheoryAttendance = require('../models/TheoryAttendance');
const PracticalAttendance = require('../models/PracticalAttendance');
const TutorialAttendance = require('../models/TutorialAttendance');
const ExtraAttendance = require('../models/ExtraAttendance');
const ExtraPract = require('../models/ExtraPract');
const Student = require('../models/Student');
const Ciann = require('../models/Ciann');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper function to calculate percentage
const calculatePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
};

const normalizeAttendanceStatus = (value = '') =>
  String(value || '').trim().toLowerCase();

const resolveStudentIdentity = (entry = {}) => ({
  rollNo: String(entry.rollNo || entry.rollId || '').trim(),
  studentName: String(entry.studentName || entry.name || '').trim(),
});

const createStudentAttendanceAggregator = ({ divisionStudents, isAllowedStudent }) => {
  const studentsMap = new Map();

  const getStudentKey = ({ rollNo, studentName }) => {
    if (rollNo) return `roll:${rollNo}`;
    if (studentName) return `name:${studentName.toLowerCase()}`;
    return '';
  };

  const ensureStudent = (entry = {}) => {
    const identity = resolveStudentIdentity(entry);
    const key = getStudentKey(identity);
    if (!key) return null;

    if (!studentsMap.has(key)) {
      studentsMap.set(key, {
        rollNo: identity.rollNo || '-',
        studentName: identity.studentName || '-',
        theory: { present: 0, total: 0, percentage: 0 },
        practical: { present: 0, total: 0, percentage: 0 },
        tutorial: { present: 0, total: 0, percentage: 0 },
        overall: { present: 0, total: 0, percentage: 0 },
      });
    }

    const student = studentsMap.get(key);
    if (!student.studentName || student.studentName === '-') {
      student.studentName = identity.studentName || student.studentName;
    }
    if ((!student.rollNo || student.rollNo === '-') && identity.rollNo) {
      student.rollNo = identity.rollNo;
    }

    return student;
  };

  // Seed from division roster so all students appear, even with no attendance yet.
  (Array.isArray(divisionStudents) ? divisionStudents : []).forEach((student) => {
    ensureStudent({
      rollNo: student.rollNo,
      studentName: student.studentName,
    });
  });

  const addCategoryEntries = (entries, category, presentField = 'status') => {
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const students = Array.isArray(entry?.students) ? entry.students : [];

      students.forEach((studentEntry) => {
        if (!isAllowedStudent(studentEntry)) return;

        const student = ensureStudent(studentEntry);
        if (!student) return;

        student[category].total += 1;

        const status = normalizeAttendanceStatus(studentEntry[presentField]);
        if (status === 'present') {
          student[category].present += 1;
        }
      });
    });
  };

  const finalize = () => {
    return Array.from(studentsMap.values())
      .map((student) => {
        student.theory.percentage = calculatePercentage(
          student.theory.present,
          student.theory.total,
        );
        student.practical.percentage = calculatePercentage(
          student.practical.present,
          student.practical.total,
        );
        student.tutorial.percentage = calculatePercentage(
          student.tutorial.present,
          student.tutorial.total,
        );

        student.overall.present =
          student.theory.present +
          student.practical.present +
          student.tutorial.present;
        student.overall.total =
          student.theory.total +
          student.practical.total +
          student.tutorial.total;
        student.overall.percentage = calculatePercentage(
          student.overall.present,
          student.overall.total,
        );

        return student;
      })
      .sort((a, b) => {
        const rollA = String(a.rollNo || '');
        const rollB = String(b.rollNo || '');
        if (rollA && rollB && rollA !== '-' && rollB !== '-') {
          return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
        }
        return String(a.studentName || '').localeCompare(String(b.studentName || ''), undefined, {
          sensitivity: 'base',
        });
      });
  };

  return {
    addCategoryEntries,
    finalize,
  };
};

router.get('/:ciannId', async (req, res) => {
  try {
    const ciannId = parseInt(req.params.ciannId);
    if (isNaN(ciannId)) {
      return res.status(400).json({ message: 'Invalid ciannId format' });
    }

    console.log(`Fetching summary for CIANN ID: ${ciannId}`);

    const ciann = await Ciann.findOne({ ciannId }).select('division');
    const ciannDivision = String(ciann?.division || '').trim();

    const divisionStudents = ciannDivision
      ? await Student.find({
          division: { $regex: new RegExp(`^${escapeRegex(ciannDivision)}$`, 'i') },
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
      if (!ciannDivision) return true;

      const roll = String(entry.rollNo || entry.rollId || '').trim();
      const name = String(entry.studentName || entry.name || '').trim().toLowerCase();

      if (roll && allowedRollNos.has(roll)) return true;
      if (name && allowedStudentNames.has(name)) return true;
      return false;
    };

    // Get total students for this CIANN from division context
    const allAttendanceRecords = await TheoryAttendance.find({ ciannId });
    let totalStudentsInClass = divisionStudents.length;
    
    if (totalStudentsInClass === 0 && allAttendanceRecords.length > 0) {
      // Get the number of students from the first attendance record
      const firstStudents = allAttendanceRecords[0].students || [];
      totalStudentsInClass = firstStudents.filter(isAllowedStudent).length;
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
    const practicals = await PracticalAttendance.find({ ciannId });
    const extraPracticals = await ExtraPract.find({ ciannId });

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
    const tutorials = await TutorialAttendance.find({ ciannId });
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

    const attendanceAggregator = createStudentAttendanceAggregator({
      divisionStudents,
      isAllowedStudent,
    });

    attendanceAggregator.addCategoryEntries(theoryAttendances, 'theory', 'status');
    attendanceAggregator.addCategoryEntries(extraAttendances, 'theory', 'attendance');
    attendanceAggregator.addCategoryEntries(practicals, 'practical', 'status');
    attendanceAggregator.addCategoryEntries(extraPracticals, 'practical', 'attendance');
    attendanceAggregator.addCategoryEntries(tutorials, 'tutorial', 'attendance');

    const studentRecords = attendanceAggregator.finalize();

    // --- Debug logging ---
    console.log('Theory Summary:', JSON.stringify(theorySummary, null, 2));
    console.log('Practical Summary:', JSON.stringify(practicalSummary, null, 2));
    console.log('Tutorial Summary:', JSON.stringify(tutorialSummary, null, 2));
    console.log(`Student-wise attendance records generated: ${studentRecords.length}`);

    // --- Final Response ---
    res.json({
      theory: theorySummary,
      practical: practicalSummary,
      tutorial: tutorialSummary,
      studentRecords,
      attendanceMeta: {
        totalStudents: totalStudentsInClass,
        ciannId,
      },
    });

  } catch (error) {
    console.error('Error in summary route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
