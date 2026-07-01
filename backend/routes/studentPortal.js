const express = require('express');
const router = express.Router();
const StudentResult = require('../models/StudentResult');
const Student = require('../models/Student');
const CTMarks = require('../models/CTMarks');
const Notice = require('../models/Notice');
const StudyMaterial = require('../models/StudyMaterial');
const Division = require('../models/Division');
const StudentMaterialProgress = require('../models/StudentMaterialProgress');
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
          (markObj.subjectCode ? `Subject (${markObj.subjectCode})` : `Subject ${markObj.CiaanId || ''}`.trim()),
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
    }).select('division departmentId divisionId academicYear enrollmentNo');

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const college = String(req.user.college || '').toUpperCase();
    const now = new Date();

    const query = {
      college,
      scheduledAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ],
      $or: [
        { targetType: "all" },
        { targetType: "all-students" },
        { targetType: "particular-student", targetStudents: { $in: [req.user.username, student.enrollmentNo] } },
        ...(student.departmentId ? [{ targetType: "departments", targetDepartments: student.departmentId }] : []),
        ...(student.divisionId ? [{ targetType: "divisions", targetDivisions: student.divisionId }] : []),
        ...(student.academicYear ? [{ targetType: "academic-year", targetAcademicYears: student.academicYear }] : [])
      ]
    };

    const notices = await Notice.find(query).sort({ scheduledAt: -1, createdAt: -1 });

    const formattedNotices = notices.map((notice) => ({
      _id: notice._id,
      title: notice.title,
      content: notice.content,
      date: notice.scheduledAt || notice.createdAt,
      category: notice.noticeType || notice.source || 'general',
      source: notice.source || 'faculty',
      priority: notice.noticeType === 'urgent' ? 'high' : 'medium',
      author: notice.faculty,
      read: notice.readBy.some((r) => String(r.userId) === String(req.user._id)),
      attachments: (notice.attachments || []).map((att, idx) => ({
        filename: att.filename,
        size: att.size,
        mimetype: att.mimetype,
        downloadUrl: `/api/office/notices/file/${notice._id}/${idx}`
      }))
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
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const alreadyRead = notice.readBy.some((r) => String(r.userId) === String(req.user._id));
    if (!alreadyRead) {
      notice.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });
      await notice.save();
    }

    res.json({ message: 'Notice marked as read', success: true });
  } catch (err) {
    console.error('Error marking notice as read:', err);
    res.status(500).json({ message: 'Failed to mark notice as read' });
  }
});

// GET study materials
router.get('/study-materials', verifyStudent, async (req, res) => {
  try {
    const student = await getStudentFromRequest(req.user);

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const institution = String(req.user.college || '').toUpperCase();
    let mappedDivisionId = student.divisionId || null;

    if (!mappedDivisionId && student.division) {
      const mappedDivision = await Division.findOne({
        institution,
        name: { $regex: exactRegex(student.division) },
      }).select('_id');
      mappedDivisionId = mappedDivision?._id || null;
    }

    const query = {
      institution,
      isActive: true,
      isDraft: { $ne: true }, // Filter drafts
    };

    if (student.courseId) {
      query.courseId = student.courseId;
    }

    if (mappedDivisionId) {
      query.divisionId = mappedDivisionId;
    } else if (student.division) {
      query.divisionName = { $regex: exactRegex(student.division) };
    }

    // Advanced search filters
    const {
      subject,
      chapterNo,
      category,
      academicYear,
      semester,
      resourceType,
      tags,
      search,
    } = req.query;

    if (subject) {
      query.subject = { $regex: exactRegex(subject) };
    }
    if (chapterNo) {
      query.chapterNo = Number(chapterNo);
    }
    if (category && category !== 'all' && category !== 'All') {
      query.category = category;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (semester) {
      query.semester = Number(semester);
    }
    if (resourceType && resourceType !== 'all') {
      query.resourceType = resourceType;
    }
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query.tags = { $in: tagList };
      }
    }
    if (search) {
      const escaped = escapeRegex(search);
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { uploadedByName: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const [materials, progressList] = await Promise.all([
      StudyMaterial.find(query)
        .populate('courseId', 'courseCode semester scheme')
        .populate('divisionId', 'name')
        .sort({ chapterNo: 1, createdAt: -1 }),
      StudentMaterialProgress.find({ studentId: student._id }),
    ]);

    const progressMap = {};
    progressList.forEach((p) => {
      progressMap[String(p.materialId)] = p;
    });

    const formatted = materials.map((item) => {
      const prog = progressMap[String(item._id)] || {};
      return {
        _id: item._id,
        title: item.title,
        description: item.description || '',
        subject: item.subject || 'General',
        type: item.category,
        category: item.category,
        resourceType: item.resourceType,
        richTextContent: item.richTextContent || '',
        thumbnailPath: item.thumbnailPath || '',
        size:
          item.resourceType === 'file'
            ? item.fileSize < 1024
              ? `${item.fileSize} B`
              : item.fileSize < 1024 * 1024
                ? `${(item.fileSize / 1024).toFixed(1)} KB`
                : `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : 'Link',
        fileSize: item.fileSize,
        date: item.createdAt,
        division: item.divisionId?.name || item.divisionName,
        course: item.courseId?.courseCode || '',
        externalUrl: item.externalUrl || '',
        downloadUrl:
          item.resourceType === 'file'
            ? `/api/study-materials/file/${item._id}`
            : item.externalUrl,
        academicYear: item.academicYear || '',
        semester: item.semester || 1,
        chapterNo: item.chapterNo || 0,
        chapterName: item.chapterName || '',
        tags: item.tags || [],
        uploadedByName: item.uploadedByName || '',
        isBookmarked: !!prog.isBookmarked,
        isCompleted: !!prog.isCompleted,
        videoProgress: prog.videoProgress || { playedSeconds: 0, playedPercentage: 0 },
        lastViewedAt: prog.lastViewedAt || null,
      };
    });

    res.json(formatted);
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