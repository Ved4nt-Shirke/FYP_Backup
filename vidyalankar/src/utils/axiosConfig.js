import axios from 'axios';

const safeRedirectToLogin = () => {
  if (window.__AUTH_REDIRECTING__) return;

  const path = window.location.pathname;
  const isAlreadyOnLogin = path === '/login';

  if (isAlreadyOnLogin) return;

  window.__AUTH_REDIRECTING__ = true;
  window.location.replace('/login');
};

// Set default base URL for API requests
axios.defaults.baseURL = '/api';

// Add request interceptor to attach token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('college');
      localStorage.removeItem('role');
      safeRedirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default axios;