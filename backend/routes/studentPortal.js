const express = require('express');
const router = express.Router();
const StudentResult = require('../models/StudentResult');
const Student = require('../models/Student');
const CTMarks = require('../models/CTMarks');
const Notice = require('../models/Notice');
const { authenticate } = require('../middleware/auth');

const normalizeUsername = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactRegex = (value = '') => new RegExp(`^${escapeRegex(String(value || '').trim())}$`, 'i');

const getStudentFromRequest = async (user) => {
  const normalized = normalizeUsername(user.username || '');

  let student = await Student.findOne({
    username: { $regex: exactRegex(normalized) },
  });

  if (!student && user.enrollmentNo) {
    student = await Student.findOne({ enrollmentNo: user.enrollmentNo });
  }

  if (!student && normalized) {
    student = await Student.findOne({ enrollmentNo: normalized });
  }

  return student;
};

// Middleware to verify student authentication
const verifyStudent = (req, res, next) => {
  authenticate(req, res, () => {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }
    next();
  });
};

// GET student results
router.get('/results', verifyStudent, async (req, res) => {
  try {
    const student = await getStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const results = await StudentResult.find({ studentId: student._id }).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error('Error fetching student results:', err);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// GET specific result by ID
router.get('/results/:id', verifyStudent, async (req, res) => {
  try {
    const student = await getStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const result = await StudentResult.findOne({
      _id: req.params.id,
      studentId: student._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Error fetching student result:', err);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
});

// GET student CT marks
router.get('/ct-marks', verifyStudent, async (req, res) => {
  try {
    const student = await getStudentFromRequest(req.user);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const marks = await CTMarks.find({
      $or: [
        { rollNo: String(student.rollNo || '').trim() },
        { studentName: { $regex: exactRegex(student.studentName || '') } },
      ],
    }).sort({ createdAt: -1, ctNumber: 1 });

    const normalizedMarks = marks.map((mark) => {
      const markObj = mark.toObject();
      return {
        ...markObj,
        subjectName:
          markObj.subjectName ||
          markObj.subject ||
          (markObj.subjectCode ? `Subject (${markObj.subjectCode})` : `Subject ${markObj.ciannId || ''}`.trim()),
        subjectCode: markObj.subjectCode || '',
      };
    });

    res.json({
      success: true,
      student: {
        studentName: student.studentName,
        rollNo: student.rollNo,
        enrollmentNo: student.enrollmentNo,
      },
      marks: normalizedMarks,
    });
  } catch (err) {
    console.error('Error fetching student CT marks:', err);
    res.status(500).json({ message: 'Failed to fetch CT marks' });
  }
});

// GET student notices
router.get('/notices', verifyStudent, async (req, res) => {
  try {
    const normalizedUsername = String(req.user.username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const student = await Student.findOne({
      username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') },
    }).select('division');

    const studentDivision = String(student?.division || '').trim();
    const college = String(req.user.college || '').toUpperCase();

    const divisionScope = [
      { division: { $exists: false } },
      { division: null },
      { division: '' },
    ];

    if (studentDivision) {
      divisionScope.push({
        division: { $regex: new RegExp(`^${studentDivision}$`, 'i') },
      });
    }

    const notices = await Notice.find({
      college,
      $or: divisionScope,
    }).sort({ createdAt: -1 });

    const formattedNotices = notices.map((notice) => ({
      _id: notice._id,
      title: notice.title,
      content: notice.content,
      date: notice.createdAt,
      category: notice.source || 'faculty',
      source: notice.source || 'faculty',
      priority: 'medium',
      author: notice.faculty,
      read: false,
    }));

    res.json(formattedNotices);
  } catch (err) {
    console.error('Error fetching student notices:', err);
    res.status(500).json({ message: 'Failed to fetch notices' });
  }
});

// POST mark notice as read
router.post('/notices/:id/read', verifyStudent, async (req, res) => {
  try {
    // In a real implementation, this would update the notice in the database
    res.json({ message: 'Notice marked as read' });
  } catch (err) {
    console.error('Error marking notice as read:', err);
    res.status(500).json({ message: 'Failed to mark notice as read' });
  }
});

// GET study materials
router.get('/study-materials', verifyStudent, async (req, res) => {
  try {
    // Mock data for study materials - in a real app, this would come from a database
    const materials = [
      {
        _id: '1',
        title: 'Mathematics Chapter 1 Notes',
        subject: 'Mathematics',
        type: 'PDF',
        size: '2.4 MB',
        date: new Date('2025-12-01')
      },
      {
        _id: '2',
        title: 'Physics Lab Manual',
        subject: 'Physics',
        type: 'PDF',
        size: '5.1 MB',
        date: new Date('2025-11-28')
      },
      {
        _id: '3',
        title: 'Chemistry Video Lectures',
        subject: 'Chemistry',
        type: 'Video',
        size: 'N/A',
        date: new Date('2025-11-25')
      }
    ];
    res.json(materials);
  } catch (err) {
    console.error('Error fetching study materials:', err);
    res.status(500).json({ message: 'Failed to fetch study materials' });
  }
});

// GET mock tests
router.get('/mock-tests', verifyStudent, async (req, res) => {
  try {
    // Mock data for mock tests - in a real app, this would come from a database
    const tests = [
      {
        _id: '1',
        title: 'Mathematics Midterm',
        subject: 'Mathematics',
        duration: 60,
        questions: 25,
        status: 'upcoming',
        date: new Date('2025-12-20')
      },
      {
        _id: '2',
        title: 'Physics Final',
        subject: 'Physics',
        duration: 90,
        questions: 40,
        status: 'upcoming',
        date: new Date('2025-12-25')
      },
      {
        _id: '3',
        title: 'Chemistry Quiz 1',
        subject: 'Chemistry',
        duration: 30,
        questions: 15,
        status: 'completed',
        date: new Date('2025-12-01')
      }
    ];
    res.json(tests);
  } catch (err) {
    console.error('Error fetching mock tests:', err);
    res.status(500).json({ message: 'Failed to fetch mock tests' });
  }
});

// POST start a mock test
router.post('/mock-tests/:id/start', verifyStudent, async (req, res) => {
  try {
    // In a real implementation, this would initialize a test session
    res.json({ message: 'Test started successfully' });
  } catch (err) {
    console.error('Error starting mock test:', err);
    res.status(500).json({ message: 'Failed to start test' });
  }
});

// GET e-library courses
router.get('/elibrary/courses', verifyStudent, async (req, res) => {
  try {
    // Mock data for courses - in a real app, this would come from a database
    const courses = [
      {
        _id: '1',
        name: 'Mathematics',
        code: 'MATH101',
        resources: 12
      },
      {
        _id: '2',
        name: 'Physics',
        code: 'PHYS101',
        resources: 8
      },
      {
        _id: '3',
        name: 'Chemistry',
        code: 'CHEM101',
        resources: 15
      }
    ];
    res.json(courses);
  } catch (err) {
    console.error('Error fetching e-library courses:', err);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// GET e-library resources by course
router.get('/elibrary/course/:courseId', verifyStudent, async (req, res) => {
  try {
    // Mock data for resources - in a real app, this would come from a database
    const resources = [
      {
        _id: '1',
        title: 'Mathematics Textbook Chapter 1',
        author: 'Dr. Smith',
        type: 'book',
        subject: 'Mathematics'
      },
      {
        _id: '2',
        title: 'Algebra Fundamentals',
        author: 'Prof. Johnson',
        type: 'article',
        subject: 'Mathematics'
      }
    ];
    res.json(resources);
  } catch (err) {
    console.error('Error fetching e-library resources:', err);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
});

// GET e-library search
router.get('/elibrary/search', verifyStudent, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Mock data for search results - in a real app, this would come from a database
    const results = [
      {
        _id: '1',
        title: 'Advanced Mathematics',
        author: 'Dr. Smith',
        type: 'book',
        subject: 'Mathematics'
      },
      {
        _id: '2',
        title: 'Physics Principles',
        author: 'Prof. Williams',
        type: 'book',
        subject: 'Physics'
      }
    ];
    res.json(results);
  } catch (err) {
    console.error('Error searching e-library:', err);
    res.status(500).json({ message: 'Failed to search resources' });
  }
});

module.exports = router;