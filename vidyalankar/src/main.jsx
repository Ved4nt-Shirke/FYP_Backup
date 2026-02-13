import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { config } from "./config/api";

// Attach base URL and auth headers for axios requests
axios.defaults.baseURL = config.apiBaseUrl;
axios.interceptors.request.use((axiosConfig) => {
  const token = localStorage.getItem("token");
  const headers = axiosConfig.headers || {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  axiosConfig.headers = headers;
  return axiosConfig;
});

// Patch fetch to auto-attach bearer token for API calls
const originalFetch = window.fetch.bind(window);
const apiBase = config.apiBaseUrl;

window.fetch = (input, init = {}) => {
  const token = localStorage.getItem("token");
  const url = typeof input === "string" ? input : input?.url || "";
  const shouldAttach =
    token && (url.startsWith(apiBase) || url.startsWith("/api"));

  if (shouldAttach) {
    const headers = new Headers(
      init.headers || (typeof input === "object" ? input.headers || {} : {})
    );
    headers.set("Authorization", `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  }

  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
