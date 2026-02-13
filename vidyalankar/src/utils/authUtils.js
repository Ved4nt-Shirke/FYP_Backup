/**
 * Authentication and Security Utilities
 * Centralized token management, encryption, and auth header handling
 */

import CryptoJS from "crypto-js";

const SECRET_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "vidyalankar-secure-key-2025";

/**
 * Secure storage: Encrypt sensitive data in localStorage
 */
export const SecureStorage = {
  setItem: (key, value) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        SECRET_KEY
      ).toString();
      localStorage.setItem(key, encrypted);
      return true;
    } catch (err) {
      console.error(`Error encrypting ${key}:`, err);
      return false;
    }
  },

  getItem: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(
        CryptoJS.enc.Utf8
      );
      return JSON.parse(decrypted);
    } catch (err) {
      console.error(`Error decrypting ${key}:`, err);
      localStorage.removeItem(key);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Error removing ${key}:`, err);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch (err) {
      console.error("Error clearing storage:", err);
      return false;
    }
  },
};

/**
 * Token management
 */
export const TokenManager = {
  setToken: (token, expiresIn = 24 * 60 * 60 * 1000) => {
    const expiresAt = Date.now() + expiresIn;
    localStorage.setItem("token", token);
    localStorage.setItem("tokenExpiry", expiresAt.toString());
    return true;
  },

  getToken: () => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("tokenExpiry");

    if (!token || !expiry) return null;

    // Check if token has expired
    if (Date.now() > parseInt(expiry)) {
      console.warn("Token has expired");
      TokenManager.clearToken();
      return null;
    }

    return token;
  },

  isTokenValid: () => {
    return !!TokenManager.getToken();
  },

  clearToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    return true;
  },

  getAuthHeader: () => {
    const token = TokenManager.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  getAuthHeaders: () => {
    return {
      "Content-Type": "application/json",
      ...TokenManager.getAuthHeader(),
    };
  },
};

/**
 * Session management
 */
export const SessionManager = {
  setSession: (sessionData) => {
    try {
      const sessionInfo = {
        user: sessionData.user || {},
        role: sessionData.role || "faculty",
        college: sessionData.college || "VP",
        loginTime: Date.now(),
        lastActivity: Date.now(),
      };

      localStorage.setItem("username", sessionData.user);
      localStorage.setItem("role", sessionData.role);
      localStorage.setItem("college", sessionData.college);
      sessionStorage.setItem("sessionInfo", JSON.stringify(sessionInfo));

      return true;
    } catch (err) {
      console.error("Error setting session:", err);
      return false;
    }
  },

  getSession: () => {
    try {
      const sessionInfo = sessionStorage.getItem("sessionInfo");
      return sessionInfo ? JSON.parse(sessionInfo) : null;
    } catch (err) {
      console.error("Error getting session:", err);
      return null;
    }
  },

  updateLastActivity: () => {
    try {
      const sessionInfo = SessionManager.getSession();
      if (sessionInfo) {
        sessionInfo.lastActivity = Date.now();
        sessionStorage.setItem("sessionInfo", JSON.stringify(sessionInfo));
      }
    } catch (err) {
      console.error("Error updating activity:", err);
    }
  },

  isSessionActive: () => {
    const session = SessionManager.getSession();
    if (!session) return false;

    // 30 minute inactivity timeout
    const inactivityTimeout = 30 * 60 * 1000;
    const timeSinceLastActivity = Date.now() - session.lastActivity;

    return timeSinceLastActivity < inactivityTimeout;
  },

  clearSession: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch (err) {
      console.error("Error clearing session:", err);
      return false;
    }
  },
};

/**
 * Fetch wrapper with built-in auth and error handling
 */
export const securefetch = async (url, options = {}) => {
  try {
    // Update last activity on each request
    SessionManager.updateLastActivity();

    // Get auth token and add to headers
    const token = TokenManager.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      console.error("Unauthorized - token expired");
      SessionManager.clearSession();
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}`,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response;
  } catch (err) {
    console.error("Secure fetch error:", err);
    throw err;
  }
};

export default {
  SecureStorage,
  TokenManager,
  SessionManager,
  securefetch,
};
