// src/SubjectDetails/api/subjectDetailsApi.js
import { config } from '../../config/api';

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
  // Get all book resources for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/book-resources/${ciannId}`),
  
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
  // Get all course outcomes for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/course-outcomes/${ciannId}`),
  
  // Create or update course outcomes (bulk operation)
  saveAll: (ciannId, outcomes) => apiCall(`${API_BASE_URL}/course-outcomes`, {
    method: 'POST',
    body: JSON.stringify({ ciannId, outcomes }),
  }),
  
  // Update a single course outcome
  update: (id, data) => apiCall(`${API_BASE_URL}/course-outcomes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== MOOC COURSES API ====================

export const moocCoursesApi = {
  // Get all MOOC courses for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/mooc-courses/${ciannId}`),
  
  // Create or update MOOC courses (bulk operation)
  saveAll: (ciannId, courses) => apiCall(`${API_BASE_URL}/mooc-courses`, {
    method: 'POST',
    body: JSON.stringify({ ciannId, courses }),
  }),
};

// ==================== SUBJECT OBJECTIVES API ====================

export const objectivesApi = {
  // Get all subject objectives for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/objectives/${ciannId}`),
  
  // Create or update subject objectives (bulk operation)
  saveAll: (ciannId, objectives) => apiCall(`${API_BASE_URL}/objectives`, {
    method: 'POST',
    body: JSON.stringify({ ciannId, objectives }),
  }),
};

// ==================== WEB RESOURCES API ====================

export const webResourcesApi = {
  // Get all web resources for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/web-resources/${ciannId}`),
  
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
  // Get knowledge map for a CIANN
  getAll: (ciannId) => apiCall(`${API_BASE_URL}/knowledge-map/${ciannId}`),
  
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

// ==================== UTILITY FUNCTIONS ====================

// Get CIANN ID from session storage or local storage
export const getCurrentCiannId = () => {
  try {
    // First try sessionStorage
    const sessionData = sessionStorage.getItem('currentCiannData');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed && parsed.ciannId) {
        return parsed.ciannId;
      }
    }
    
    // Then try localStorage
    const localData = localStorage.getItem('ciannData');
    if (localData) {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.ciannId) {
        return parsed.ciannId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current CIANN ID:', error);
    return null;
  }
};

// Error handler for components
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  return error.message || defaultMessage;
};