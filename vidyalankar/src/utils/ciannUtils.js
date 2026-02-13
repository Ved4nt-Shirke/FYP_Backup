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
};

export default ciannUtils;
