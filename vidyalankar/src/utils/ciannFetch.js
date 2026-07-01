/**
 * Centralized Ciaan fetching utility
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

export const fetchCiaansWithAuth = async () => {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(config.Ciaans, {
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
      throw new Error(`HTTP ${response.status}: Failed to fetch Ciaans`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Ciaans:", error);
    throw error;
  }
};

export const fetchCiaansWithAxios = async (axios) => {
  try {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await axios.get(config.Ciaans, {
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
    console.error("Error fetching Ciaans:", error);
    throw error;
  }
};

export default {
  fetchCiaansWithAuth,
  fetchCiaansWithAxios,
};
