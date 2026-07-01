// API service for student portal
const API_BASE_URL = '/api/student-portal';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Results API
export const resultsService = {
  // Get student results
  getResults: async () => {
    return await apiRequest('/results');
  },

  // Get CT marks for logged-in student
  getCtMarks: async () => {
    return await apiRequest('/ct-marks');
  },
  
  // Get specific result by ID
  getResultById: async (id) => {
    return await apiRequest(`/results/${id}`);
  }
};

// Notices API
export const noticesService = {
  // Get all notices
  getNotices: async () => {
    return await apiRequest('/notices');
  },
  
  // Get notice by ID
  getNoticeById: async (id) => {
    return await apiRequest(`/notices/${id}`);
  },
  
  // Mark notice as read
  markAsRead: async (id) => {
    return await apiRequest(`/notices/${id}/read`, {
      method: 'POST'
    });
  }
};

// Study Materials API
export const studyMaterialsService = {
  // Get all study materials (with optional query filters)
  getMaterials: async (filters = {}) => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        params.append(key, val);
      }
    });
    const queryString = params.toString();
    const url = `/api/study-materials/student/current${queryString ? "?" + queryString : ""}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data?.materials) ? data.materials : [];
  },
  
  // Get materials by subject
  getMaterialsBySubject: async (subject) => {
    const token = getAuthToken();
    const response = await fetch(`/api/study-materials/student/current?subject=${encodeURIComponent(subject)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data?.materials) ? data.materials : [];
  },
  
  // Download material
  downloadMaterial: async (id) => {
    const token = getAuthToken();
    const response = await fetch(`/api/study-materials/file/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  },

  // Update progress (bookmark, mark completed, watch progress)
  updateProgress: async (materialId, fields = {}) => {
    const token = getAuthToken();
    const response = await fetch('/api/study-materials/student/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ materialId, ...fields })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get recently viewed materials
  getRecentlyViewed: async () => {
    const token = getAuthToken();
    const response = await fetch('/api/study-materials/student/recently-viewed', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data?.materials) ? data.materials : [];
  },

  // Get continue watching video lectures
  getContinueWatching: async () => {
    const token = getAuthToken();
    const response = await fetch('/api/study-materials/student/continue-watching', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data?.materials) ? data.materials : [];
  }
};

// Mock Tests API
export const mockTestsService = {
  // Get all available tests
  getTests: async () => {
    const token = getAuthToken();
    const response = await fetch('/api/mock-exams/student/exams', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    if (!response.ok) throw new Error(`Failed to load tests`);
    const data = await response.json();
    return Array.isArray(data?.exams) ? data.exams : [];
  },
  
  // Get test by ID
  getTestById: async (id) => {
    const token = getAuthToken();
    const response = await fetch(`/api/mock-exams/student/exams/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    if (!response.ok) throw new Error(`Failed to load test`);
    const data = await response.json();
    return data?.exam;
  },
  
  // Start a test
  startTest: async (testId) => {
    const token = getAuthToken();
    const response = await fetch(`/api/mock-exams/student/exams/${testId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    if (!response.ok) throw new Error(`Failed to start test`);
    return await response.json();
  },
  
  // Submit test answers
  submitTest: async (testId, answers) => {
    const token = getAuthToken();
    const response = await fetch(`/api/mock-exams/student/exams/${testId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) throw new Error(`Failed to submit test`);
    return await response.json();
  }
};

// E-library API
export const elibraryService = {
  // Search resources
  searchResources: async (query) => {
    return await apiRequest(`/elibrary/search?q=${query}`);
  },
  
  // Get resources by course
  getResourcesByCourse: async (courseId) => {
    return await apiRequest(`/elibrary/course/${courseId}`);
  },
  
  // Get all courses
  getCourses: async () => {
    return await apiRequest('/elibrary/courses');
  }
};

// Student Timetable API
export const studentTimetableService = {
  getCurrent: async () => {
    const token = getAuthToken();
    const response = await fetch(`/api/student-timetables/student/current`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current timetable (${response.status})`);
    }

    return await response.json();
  },

  openFile: async (id) => {
    const token = getAuthToken();
    const response = await fetch(`/api/student-timetables/file/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to open file (${response.status})`);
    }

    return await response.blob();
  },
};

export default {
  resultsService,
  noticesService,
  studyMaterialsService,
  mockTestsService,
  elibraryService,
  studentTimetableService,
};