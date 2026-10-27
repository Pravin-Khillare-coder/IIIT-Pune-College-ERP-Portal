import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token to outgoing API requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iiitp_erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for handling 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired auth session
      localStorage.removeItem('iiitp_erp_token');
      localStorage.removeItem('iiitp_erp_user');
    }
    return Promise.reject(error);
  }
);
