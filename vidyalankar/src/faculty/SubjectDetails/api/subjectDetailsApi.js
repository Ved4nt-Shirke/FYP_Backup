// src/SubjectDetails/api/subjectDetailsApi.js
import { config } from '../../../config/api';

const API_BASE_URL = config.subjectDetails;

// Generic API call function
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// ==================== BOOK RESOURCES API ====================

export const bookResourcesApi = {
  // Get all book resources for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/book-resources/${CiaanId}`),

  // Create a new book resource
  create: (data) => apiCall(`${API_BASE_URL}/book-resources`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update a book resource
  update: (id, data) => apiCall(`${API_BASE_URL}/book-resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete a book resource
  delete: (id) => apiCall(`${API_BASE_URL}/book-resources/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== COURSE OUTCOMES API ====================

export const courseOutcomesApi = {
  // Get all course outcomes for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/course-outcomes/${CiaanId}`),

  // Create or update course outcomes (bulk operation)
  saveAll: (CiaanId, outcomes) => apiCall(`${API_BASE_URL}/course-outcomes`, {
    method: 'POST',
    body: JSON.stringify({ CiaanId, outcomes }),
  }),

  // Update a single course outcome
  update: (id, data) => apiCall(`${API_BASE_URL}/course-outcomes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== MOOC COURSES API ====================

export const moocCoursesApi = {
  // Get all MOOC courses for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/mooc-courses/${CiaanId}`),

  // Create or update MOOC courses (bulk operation)
  saveAll: (CiaanId, courses) => apiCall(`${API_BASE_URL}/mooc-courses`, {
    method: 'POST',
    body: JSON.stringify({ CiaanId, courses }),
  }),
};

// ==================== SUBJECT OBJECTIVES API ====================

export const objectivesApi = {
  // Get all subject objectives for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/objectives/${CiaanId}`),

  // Create or update subject objectives (bulk operation)
  saveAll: (CiaanId, objectives) => apiCall(`${API_BASE_URL}/objectives`, {
    method: 'POST',
    body: JSON.stringify({ CiaanId, objectives }),
  }),
};

// ==================== WEB RESOURCES API ====================

export const webResourcesApi = {
  // Get all web resources for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/web-resources/${CiaanId}`),

  // Create a new web resource
  create: (data) => apiCall(`${API_BASE_URL}/web-resources`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update a web resource
  update: (id, data) => apiCall(`${API_BASE_URL}/web-resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete a web resource
  delete: (id) => apiCall(`${API_BASE_URL}/web-resources/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== KNOWLEDGE MAP API ====================

export const knowledgeMapApi = {
  // Get knowledge map for a Ciaan
  getAll: (CiaanId) => apiCall(`${API_BASE_URL}/knowledge-map/${CiaanId}`),

  // Create knowledge map
  create: (data) => apiCall(`${API_BASE_URL}/knowledge-map`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update knowledge map
  update: (id, data) => apiCall(`${API_BASE_URL}/knowledge-map/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== Ciaan SUBJECT DETAILS API ====================

export const CiaanSubjectDetailsApi = {
  // Get all details for a Ciaan
  getDetails: (CiaanId) => apiCall(`${API_BASE_URL}/Ciaan/${CiaanId}`),

  // Update details (can update entire document or specific fields)
  updateDetails: (CiaanId, updateData) => apiCall(`${API_BASE_URL}/Ciaan/${CiaanId}`, {
    method: 'POST',
    body: JSON.stringify(updateData),
  }),
};

// ==================== UTILITY FUNCTIONS ====================

// Get CIAAN ID from session storage or local storage
export const getCurrentCiaanId = () => {
  try {
    // First try sessionStorage
    const sessionData = sessionStorage.getItem('currentCiaanData');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed && parsed.CiaanId) {
        return parsed.CiaanId;
      }
    }

    // Then try localStorage
    const localData = localStorage.getItem('CiaanData');
    if (localData) {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.CiaanId) {
        return parsed.CiaanId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current CIAAN ID:', error);
    return null;
  }
};

// Error handler for components
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  return error.message || defaultMessage;
};