// Utility functions for CIANN operations
import axios from "axios";
import { config } from "../config/api";

const CIANN_URL = config.cianns;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ciannUtils = {
  // Fetch all CIANNs
  fetchAllCianns: async () => {
    try {
      const response = await axios.get(CIANN_URL, { headers: authHeaders() });
      return response.data;
    } catch (error) {
      console.error("Error fetching CIANNs:", error);
      throw error;
    }
  },

  // Fetch CIANN by ID
  fetchCiannById: async (ciannId) => {
    try {
      const response = await axios.get(`${CIANN_URL}/${ciannId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Create new CIANN
  createCiann: async (ciannData) => {
    try {
      const response = await axios.post(CIANN_URL, ciannData, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating CIANN:", error);
      throw error;
    }
  },

  // Update CIANN
  updateCiann: async (ciannId, ciannData) => {
    try {
      const response = await axios.put(`${CIANN_URL}/${ciannId}`, ciannData, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Delete CIANN
  deleteCiann: async (ciannId) => {
    try {
      const response = await axios.delete(`${CIANN_URL}/${ciannId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Share CIANN with another user
  shareCiann: async (ciannId, username, permission) => {
    try {
      const response = await axios.post(
        `${CIANN_URL}/${ciannId}/share`,
        { username, permission },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error sharing CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Request access to an existing CIANN by CIANN ID
  requestCiannAccess: async (ciannId, permission = "read") => {
    try {
      const response = await axios.post(
        `${CIANN_URL}/${ciannId}/request-access`,
        { permission },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error requesting access for CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Get incoming share requests for CIANNs owned by current user
  getIncomingShareRequests: async () => {
    try {
      const response = await axios.get(`${CIANN_URL}/share-requests/incoming`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching incoming share requests:", error);
      throw error;
    }
  },

  // Get outgoing share requests sent by current user
  getOutgoingShareRequests: async () => {
    try {
      const response = await axios.get(`${CIANN_URL}/share-requests/outgoing`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching outgoing share requests:", error);
      throw error;
    }
  },

  // Respond to a share request (owner action)
  respondToShareRequest: async (ciannId, requestId, action) => {
    try {
      const response = await axios.post(
        `${CIANN_URL}/${ciannId}/share-requests/${requestId}/respond`,
        { action },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error responding to request ${requestId} for CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Get all share entries for a CIANN
  getCiannShares: async (ciannId) => {
    try {
      const response = await axios.get(`${CIANN_URL}/${ciannId}/shares`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching shares for CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Remove a share entry from a CIANN
  removeCiannShare: async (ciannId, userId) => {
    try {
      const response = await axios.delete(`${CIANN_URL}/${ciannId}/share/${userId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing CIANN share for ${ciannId}:`, error);
      throw error;
    }
  },

  // Get CIANN from localStorage
  getCiannFromStorage: () => {
    try {
      const ciannDataStr = localStorage.getItem("ciannData");
      if (!ciannDataStr) {
        return null;
      }
      return JSON.parse(ciannDataStr);
    } catch (error) {
      console.error("Error parsing CIANN data from localStorage:", error);
      return null;
    }
  },

  // Save CIANN to localStorage
  saveCiannToStorage: (ciannData) => {
    try {
      localStorage.setItem("ciannData", JSON.stringify(ciannData));
      return true;
    } catch (error) {
      console.error("Error saving CIANN data to localStorage:", error);
      return false;
    }
  },

  // Clear CIANN from localStorage
  clearCiannFromStorage: () => {
    try {
      localStorage.removeItem("ciannData");
      return true;
    } catch (error) {
      console.error("Error clearing CIANN data from localStorage:", error);
      return false;
    }
  },

  // Validate CIANN data (allows server-generated ciannId when specified)
  validateCiann: (ciannData, { allowGeneratedId = false } = {}) => {
    if (!ciannData) {
      return { isValid: false, error: "CIANN data is required" };
    }

    if (!allowGeneratedId) {
      if (!ciannData.ciannId) {
        return { isValid: false, error: "CIANN ID is required" };
      }

      if (
        typeof ciannData.ciannId !== "number" ||
        ciannData.ciannId < 1000 ||
        ciannData.ciannId > 9999
      ) {
        return { isValid: false, error: "CIANN ID must be a 4-digit number" };
      }
    }

    if (!ciannData.department) {
      return { isValid: false, error: "Department is required" };
    }

    if (!ciannData.subject) {
      return { isValid: false, error: "Subject is required" };
    }

    if (!ciannData.division) {
      return { isValid: false, error: "Division is required" };
    }

    return { isValid: true };
  },

  // Fetch faculty directory
  fetchFacultyDirectory: async (search = "", department = "") => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (department) params.append("department", department);
      
      const response = await axios.get(
        `${config.apiBaseUrl}/faculty/directory?${params.toString()}`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching faculty directory:", error);
      throw error;
    }
  },

  // Fetch CIANNs owned by a user
  fetchCiannsByUsername: async (username) => {
    try {
      const response = await axios.get(
        `${CIANN_URL}/user/${username}`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching CIANNs for user ${username}:`, error);
      throw error;
    }
  },

  // Sync CIANN workspace edits
  syncCiann: async (ciannId, ciannData, lastSyncedAt, section, details) => {
    try {
      const response = await axios.post(
        `${CIANN_URL}/${ciannId}/sync`,
        { ciannData, lastSyncedAt, section, details },
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error syncing CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Fetch notifications
  fetchNotifications: async () => {
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/notifications`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/notifications/${notificationId}/read`,
        {},
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/notifications/read-all`,
        {},
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Add comment to CIANN
  addComment: async (ciannId, comment) => {
    try {
      const response = await axios.post(
        `${CIANN_URL}/${ciannId}/comments`,
        { comment },
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to CIANN ${ciannId}:`, error);
      throw error;
    }
  },

  // Fetch collaboration logs
  fetchCollaborationLogs: async (ciannId) => {
    try {
      const response = await axios.get(
        `${CIANN_URL}/${ciannId}/collaboration-logs`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching collaboration logs for CIANN ${ciannId}:`, error);
      throw error;
    }
  },
};

export default ciannUtils;
