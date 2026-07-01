// src/utils/searchUtils.js

import axios from 'axios';
import { config } from '../config/api';

// Navigation items for search
const navigationItems = [
  { title: 'Dashboard', path: '/dashboard', category: 'Navigation' },
  { title: 'Theory Attendance', path: '/theory-attendance', category: 'Navigation' },
  { title: 'Practical Attendance', path: '/practical-attendance', category: 'Navigation' },
  { title: 'Extra Theory', path: '/extra-theory', category: 'Navigation' },
  { title: 'Extra Practical', path: '/extra-practical', category: 'Navigation' },
  { title: 'Tutorial Attendance', path: '/tutorial-attendance', category: 'Navigation' },
  { title: 'Timetable', path: '/timetable', category: 'Navigation' },
  { title: 'Students Management', path: '/students', category: 'Navigation' },
  { title: 'Reports', path: '/reports', category: 'Navigation' },
];

// Search function
export const performSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchQuery = query.toLowerCase().trim();
  const results = [];

  try {
    // Search Navigation Items
    const navResults = navigationItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery)
    ).map(item => ({
      ...item,
      type: 'navigation',
      id: `nav-${item.path}`,
    }));
    results.push(...navResults);

    // Search Students
    try {
      const studentsResponse = await axios.get(config.students);
      const studentResults = studentsResponse.data
        .filter(student =>
          student.studentName.toLowerCase().includes(searchQuery) ||
          student.rollNo.toString().includes(searchQuery) ||
          (student.batch && student.batch.toLowerCase().includes(searchQuery))
        )
        .slice(0, 10) // Limit to 10 results
        .map(student => ({
          id: `student-${student.rollNo}`,
          title: student.studentName,
          subtitle: `Roll No: ${student.rollNo}${student.batch ? ` | Batch: ${student.batch}` : ''}`,
          category: 'Students',
          type: 'student',
          data: student,
        }));
      results.push(...studentResults);
    } catch (error) {
      console.warn('Failed to search students:', error);
    }

    // Search Attendance Records (Theory)
    try {
      const theoryResponse = await axios.get(config.attendance.theory);
      const theoryResults = theoryResponse.data
        .filter(record =>
          record.topic.toLowerCase().includes(searchQuery) ||
          record.CiaanId.toLowerCase().includes(searchQuery) ||
          record.date.includes(searchQuery)
        )
        .slice(0, 5) // Limit to 5 results
        .map(record => ({
          id: `theory-${record._id}`,
          title: record.topic,
          subtitle: `CIAAN ID: ${record.CiaanId} | Date: ${record.date}`,
          category: 'Theory Attendance',
          type: 'attendance',
          subtype: 'theory',
          data: record,
        }));
      results.push(...theoryResults);
    } catch (error) {
      console.warn('Failed to search theory attendance:', error);
    }

    // Search Practical Attendance Records
    try {
      const practicalResponse = await axios.get(config.attendance.practical);
      const practicalResults = practicalResponse.data
        .filter(record =>
          record.topic.toLowerCase().includes(searchQuery) ||
          record.CiaanId.toLowerCase().includes(searchQuery) ||
          record.date.includes(searchQuery)
        )
        .slice(0, 5) // Limit to 5 results
        .map(record => ({
          id: `practical-${record._id}`,
          title: record.topic,
          subtitle: `CIAAN ID: ${record.CiaanId} | Date: ${record.date}`,
          category: 'Practical Attendance',
          type: 'attendance',
          subtype: 'practical',
          data: record,
        }));
      results.push(...practicalResults);
    } catch (error) {
      console.warn('Failed to search practical attendance:', error);
    }

    // Search Tutorial Attendance Records
    try {
      const tutorialResponse = await axios.get(config.attendance.tutorial);
      const tutorialResults = tutorialResponse.data
        .filter(record =>
          record.Topic.toLowerCase().includes(searchQuery) ||
          record.CiaanId.toLowerCase().includes(searchQuery) ||
          record.actualDate.includes(searchQuery)
        )
        .slice(0, 5) // Limit to 5 results
        .map(record => ({
          id: `tutorial-${record._id}`,
          title: record.Topic,
          subtitle: `CIAAN ID: ${record.CiaanId} | Date: ${record.actualDate}`,
          category: 'Tutorial Attendance',
          type: 'attendance',
          subtype: 'tutorial',
          data: record,
        }));
      results.push(...tutorialResults);
    } catch (error) {
      console.warn('Failed to search tutorial attendance:', error);
    }

  } catch (error) {
    console.error('Search error:', error);
  }

  // Sort results by relevance (exact matches first, then partial matches)
  return results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === searchQuery;
    const bExact = b.title.toLowerCase() === searchQuery;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = a.title.toLowerCase().startsWith(searchQuery);
    const bStarts = b.title.toLowerCase().startsWith(searchQuery);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return a.title.localeCompare(b.title);
  });
};

// Handle search result click
export const handleSearchResultClick = (result, navigate) => {
  switch (result.type) {
    case 'navigation':
      navigate(result.path);
      break;
    case 'student':
      // Navigate to student details or students page with filter
      navigate('/students', { state: { searchStudent: result.data.rollNo } });
      break;
    case 'attendance':
      // Navigate to appropriate attendance page
      if (result.subtype === 'theory') {
        navigate('/theory-Ciaan-cards');
      } else if (result.subtype === 'practical') {
        navigate('/practical-Ciaan-cards');
      } else if (result.subtype === 'tutorial') {
        navigate('/extra-theory-Ciaan-cards');
      }
      break;
    default:
      console.log('Unknown result type:', result);
  }
};