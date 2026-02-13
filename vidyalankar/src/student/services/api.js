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
    return await apiRequest('/students/results');
  },
  
  // Get specific result by ID
  getResultById: async (id) => {
    return await apiRequest(`/students/results/${id}`);
  }
};

// Notices API
export const noticesService = {
  // Get all notices
  getNotices: async () => {
    return await apiRequest('/students/notices');
  },
  
  // Get notice by ID
  getNoticeById: async (id) => {
    return await apiRequest(`/students/notices/${id}`);
  },
  
  // Mark notice as read
  markAsRead: async (id) => {
    return await apiRequest(`/students/notices/${id}/read`, {
      method: 'POST'
    });
  }
};

// Study Materials API
export const studyMaterialsService = {
  // Get all study materials
  getMaterials: async () => {
    return await apiRequest('/students/study-materials');
  },
  
  // Get materials by subject
  getMaterialsBySubject: async (subject) => {
    return await apiRequest(`/students/study-materials?subject=${subject}`);
  },
  
  // Download material
  downloadMaterial: async (id) => {
    return await apiRequest(`/students/study-materials/${id}/download`);
  }
};

// Mock Tests API
export const mockTestsService = {
  // Get all available tests
  getTests: async () => {
    return await apiRequest('/students/mock-tests');
  },
  
  // Get test by ID
  getTestById: async (id) => {
    return await apiRequest(`/students/mock-tests/${id}`);
  },
  
  // Start a test
  startTest: async (testId) => {
    return await apiRequest(`/students/mock-tests/${testId}/start`, {
      method: 'POST'
    });
  },
  
  // Submit test answers
  submitTest: async (testId, answers) => {
    return await apiRequest(`/students/mock-tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }
};

// E-library API
export const elibraryService = {
  // Search resources
  searchResources: async (query) => {
    return await apiRequest(`/students/elibrary/search?q=${query}`);
  },
  
  // Get resources by course
  getResourcesByCourse: async (courseId) => {
    return await apiRequest(`/students/elibrary/course/${courseId}`);
  },
  
  // Get all courses
  getCourses: async () => {
    return await apiRequest('/students/elibrary/courses');
  }
};

export default {
  resultsService,
  noticesService,
  studyMaterialsService,
  mockTestsService,
  elibraryService
};