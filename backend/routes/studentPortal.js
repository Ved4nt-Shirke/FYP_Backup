const express = require('express');
const router = express.Router();
const StudentResult = require('../models/StudentResult');
const Student = require('../models/Student');

// Middleware to verify student authentication
const verifyStudent = (req, res, next) => {
  // In a real implementation, you would verify the JWT token here
  // For now, we'll just pass through
  next();
};

// GET student results
router.get('/results', verifyStudent, async (req, res) => {
  try {
    // In a real implementation, you would get the student ID from the verified token
    // For now, we'll return all results as a demo
    const results = await StudentResult.find().sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error('Error fetching student results:', err);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// GET specific result by ID
router.get('/results/:id', verifyStudent, async (req, res) => {
  try {
    const result = await StudentResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Error fetching student result:', err);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
});

// GET student notices
router.get('/notices', verifyStudent, async (req, res) => {
  try {
    // Mock data for notices - in a real app, this would come from a database
    const notices = [
      {
        _id: '1',
        title: 'Exam Schedule Announcement',
        content: 'The final examination schedule for Semester 1 has been published. Please check your email for detailed timings.',
        date: new Date('2025-12-15'),
        category: 'examination',
        priority: 'high',
        author: 'Examination Department',
        read: false
      },
      {
        _id: '2',
        title: 'Library Holiday Notice',
        content: 'The library will remain closed on December 25th and 26th for Christmas holidays. Regular services will resume on December 27th.',
        date: new Date('2025-12-10'),
        category: 'library',
        priority: 'medium',
        author: 'Library Administration',
        read: false
      },
      {
        _id: '3',
        title: 'Workshop on Career Development',
        content: 'A career development workshop will be conducted on January 5th, 2026. All students are encouraged to participate.',
        date: new Date('2025-12-05'),
        category: 'events',
        priority: 'high',
        author: 'Placement Cell',
        read: true
      }
    ];
    res.json(notices);
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