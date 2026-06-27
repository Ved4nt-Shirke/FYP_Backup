/**
 * Centralized CIANN fetching utility
 * Handles auth headers, error handling, and token expiry
 */

import { config } from "../config/api";
import { TokenManager } from "./authUtils";

const safeRedirectToLogin = () => {
  if (window.__AUTH_REDIRECTING__) return;
  if (window.location.pathname === "/login") return;

  window.__AUTH_REDIRECTING__ = true;
  window.location.replace("/login");
};

export const fetchCiannsWithAuth = async (academicYear) => {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const url = academicYear 
      ? `${config.cianns}?academicYear=${encodeURIComponent(academicYear)}` 
      : config.cianns;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      TokenManager.clearToken();
      safeRedirectToLogin();
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
      safeRedirectToLogin();
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
