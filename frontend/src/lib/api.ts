import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('tdc_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('tdc_refresh_token');
        if (refreshToken) {
          try {
            const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh: refreshToken });
            const newAccess = res.data.access;
            localStorage.setItem('tdc_access_token', newAccess);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return api(originalRequest);
          } catch (refreshErr) {
            localStorage.removeItem('tdc_access_token');
            localStorage.removeItem('tdc_refresh_token');
            localStorage.removeItem('tdc_user');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
