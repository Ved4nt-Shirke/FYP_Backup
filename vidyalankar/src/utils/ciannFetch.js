/**
 * Centralized CIANN fetching utility
 * Handles auth headers, error handling, and token expiry
 */

import { config } from "../config/api";
import { TokenManager } from "./authUtils";

export const fetchCiannsWithAuth = async () => {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(config.cianns, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      TokenManager.clearToken();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch CIANNs`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching CIANNs:", error);
    throw error;
  }
};

export const fetchCiannsWithAxios = async (axios) => {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await axios.get(config.cianns, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      TokenManager.clearToken();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    console.error("Error fetching CIANNs:", error);
    throw error;
  }
};

export default {
  fetchCiannsWithAuth,
  fetchCiannsWithAxios,
};
