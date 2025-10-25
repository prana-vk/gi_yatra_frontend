// ========== GI LOCATIONS (MINIMAL) ==========

import axios from 'axios';

// --- runtime-configurable API base URL ---

const STORAGE_KEY = 'giyatra_api_base';

// buildDefaultBase removed (unused) — default base handled in getApiBaseUrl

export function getApiBaseUrl() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch (e) {
    // ignore storage errors
  }
  // allow explicit env override of full base URL
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
  return 'https://backend-k4x8.onrender.com';
}

export function setApiBaseUrl(url) {
  const normalized = (url || '').replace(/\/$/, '');
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch (e) {
    // ignore
  }
  if (api) api.defaults.baseURL = normalized; // updated below when api exists
  return normalized;
}

// If no stored API base and no env override, persist the provided default backend URL
try {
  const _stored = localStorage.getItem(STORAGE_KEY);
  if (!_stored && !process.env.REACT_APP_API_BASE) {
    // default backend provided by user
    localStorage.setItem(STORAGE_KEY, 'https://backend-k4x8.onrender.com');
  }
} catch (e) {
  // ignore storage errors
}

const API_BASE_URL = getApiBaseUrl();

// Helper to get cookie value by name (for CSRF)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

// ensure setApiBaseUrl updates this axios instance too
export function _setApiInstanceBase(url) {
  api.defaults.baseURL = url;
}

// Attach X-CSRFToken for all requests if cookie is present
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      error.message = 'Too many requests. Please wait a minute and try again.';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Fetch CSRF token on app load (for local dev)
export async function ensureCsrfToken() {
  try {
    await api.get('/api/auth/csrf/');
  } catch (e) {
    // Ignore errors
  }
}

// ========== AUTH & USER ENDPOINTS ==========

export const signup = async (email, password) => {
  const response = await api.post('/api/auth/signup/', { email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login/', { email, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/auth/logout/');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me/');
  return response.data;
};

// ========== PASSWORD RESET (TOKEN LINK) ==========

export const requestPasswordReset = async (email) => {
  const response = await api.post('/api/auth/password-reset/', { email });
  return response.data;
};

export const passwordResetConfirm = async (email, token, password) => {
  const response = await api.post('/api/auth/password-reset/confirm/', { email, token, password });
  return response.data;
};

// ========== OTP-BASED SPA ENDPOINTS ==========

export const signupRequestOtp = async (email) => {
  const response = await api.post('/api/auth/api/signup/request-otp/', { email });
  return response.data;
};

export const signupConfirmOtp = async (email, otp, password) => {
  const response = await api.post('/api/auth/api/signup/confirm-otp/', { email, otp, password });
  return response.data;
};

export const passwordResetRequestOtp = async (email) => {
  const response = await api.post('/api/auth/api/password-reset/request-otp/', { email });
  return response.data;
};

export const passwordResetConfirmOtp = async (email, otp, new_password) => {
  const response = await api.post('/api/auth/api/password-reset/confirm-otp/', { email, otp, new_password });
  return response.data;
};

// ========== CSRF TOKEN ==========

export const getCsrfToken = async () => {
  const response = await api.get('/api/auth/csrf/');
  return response.data;
};

export default api;

// Expose main list utilities that rely on `api` (export after api is created)
export const getAllGILocations = async (params = {}) => {
  const response = await api.get('/api/gi-locations/', { params });
  return response.data;
};

export const getAllDistricts = async () => {
  const response = await api.get('/api/gi-locations/districts/');
  return response.data.districts || [];
};