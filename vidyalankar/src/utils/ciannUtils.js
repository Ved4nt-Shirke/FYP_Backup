// Utility functions for Ciaan operations
import axios from "axios";
import { config } from "../config/api";

const Ciaan_URL = config.Ciaans;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const CiaanUtils = {
  // Fetch all Ciaans
  fetchAllCiaans: async () => {
    try {
      const response = await axios.get(Ciaan_URL, { headers: authHeaders() });
      return response.data;
    } catch (error) {
      console.error("Error fetching Ciaans:", error);
      throw error;
    }
  },

  // Fetch Ciaan by ID
  fetchCiaanById: async (CiaanId) => {
    try {
      const response = await axios.get(`${Ciaan_URL}/${CiaanId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Create new Ciaan
  createCiaan: async (CiaanData) => {
    try {
      const response = await axios.post(Ciaan_URL, CiaanData, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating Ciaan:", error);
      throw error;
    }
  },

  // Update Ciaan
  updateCiaan: async (CiaanId, CiaanData) => {
    try {
      const response = await axios.put(`${Ciaan_URL}/${CiaanId}`, CiaanData, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Delete Ciaan
  deleteCiaan: async (CiaanId) => {
    try {
      const response = await axios.delete(`${Ciaan_URL}/${CiaanId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Share Ciaan with another user
  shareCiaan: async (CiaanId, username, permission) => {
    try {
      const response = await axios.post(
        `${Ciaan_URL}/${CiaanId}/share`,
        { username, permission },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error sharing Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Request access to an existing Ciaan by Ciaan ID
  requestCiaanAccess: async (CiaanId, permission = "read") => {
    try {
      const response = await axios.post(
        `${Ciaan_URL}/${CiaanId}/request-access`,
        { permission },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error requesting access for Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Get incoming share requests for Ciaans owned by current user
  getIncomingShareRequests: async () => {
    try {
      const response = await axios.get(`${Ciaan_URL}/share-requests/incoming`, {
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
      const response = await axios.get(`${Ciaan_URL}/share-requests/outgoing`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching outgoing share requests:", error);
      throw error;
    }
  },

  // Respond to a share request (owner action)
  respondToShareRequest: async (CiaanId, requestId, action) => {
    try {
      const response = await axios.post(
        `${Ciaan_URL}/${CiaanId}/share-requests/${requestId}/respond`,
        { action },
        { headers: authHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error(`Error responding to request ${requestId} for Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Get all share entries for a Ciaan
  getCiaanShares: async (CiaanId) => {
    try {
      const response = await axios.get(`${Ciaan_URL}/${CiaanId}/shares`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching shares for Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Remove a share entry from a Ciaan
  removeCiaanShare: async (CiaanId, userId) => {
    try {
      const response = await axios.delete(`${Ciaan_URL}/${CiaanId}/share/${userId}`, {
        headers: authHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error removing Ciaan share for ${CiaanId}:`, error);
      throw error;
    }
  },

  // Get Ciaan from localStorage
  getCiaanFromStorage: () => {
    try {
      const CiaanDataStr = localStorage.getItem("CiaanData");
      if (!CiaanDataStr) {
        return null;
      }
      return JSON.parse(CiaanDataStr);
    } catch (error) {
      console.error("Error parsing Ciaan data from localStorage:", error);
      return null;
    }
  },

  // Save Ciaan to localStorage
  saveCiaanToStorage: (CiaanData) => {
    try {
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
      return true;
    } catch (error) {
      console.error("Error saving Ciaan data to localStorage:", error);
      return false;
    }
  },

  // Clear Ciaan from localStorage
  clearCiaanFromStorage: () => {
    try {
      localStorage.removeItem("CiaanData");
      return true;
    } catch (error) {
      console.error("Error clearing Ciaan data from localStorage:", error);
      return false;
    }
  },

  // Validate Ciaan data (allows server-generated CiaanId when specified)
  validateCiaan: (CiaanData, { allowGeneratedId = false } = {}) => {
    if (!CiaanData) {
      return { isValid: false, error: "Ciaan data is required" };
    }

    if (!allowGeneratedId) {
      if (!CiaanData.CiaanId) {
        return { isValid: false, error: "Ciaan ID is required" };
      }

      if (
        typeof CiaanData.CiaanId !== "number" ||
        CiaanData.CiaanId < 1000 ||
        CiaanData.CiaanId > 9999
      ) {
        return { isValid: false, error: "Ciaan ID must be a 4-digit number" };
      }
    }

    if (!CiaanData.department) {
      return { isValid: false, error: "Department is required" };
    }

    if (!CiaanData.subject) {
      return { isValid: false, error: "Subject is required" };
    }

    if (!CiaanData.division) {
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

  // Fetch Ciaans owned by a user
  fetchCiaansByUsername: async (username) => {
    try {
      const response = await axios.get(
        `${Ciaan_URL}/user/${username}`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching Ciaans for user ${username}:`, error);
      throw error;
    }
  },

  // Sync Ciaan workspace edits
  syncCiaan: async (CiaanId, CiaanData, lastSyncedAt, section, details) => {
    try {
      const response = await axios.post(
        `${Ciaan_URL}/${CiaanId}/sync`,
        { CiaanData, lastSyncedAt, section, details },
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error syncing Ciaan ${CiaanId}:`, error);
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

  // Add comment to Ciaan
  addComment: async (CiaanId, comment) => {
    try {
      const response = await axios.post(
        `${Ciaan_URL}/${CiaanId}/comments`,
        { comment },
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },

  // Fetch collaboration logs
  fetchCollaborationLogs: async (CiaanId) => {
    try {
      const response = await axios.get(
        `${Ciaan_URL}/${CiaanId}/collaboration-logs`,
        { headers: authHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching collaboration logs for Ciaan ${CiaanId}:`, error);
      throw error;
    }
  },
};

export default CiaanUtils;
