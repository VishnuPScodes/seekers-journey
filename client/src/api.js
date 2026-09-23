import axios from 'axios';

// Normalize baseURL: strip trailing slashes and ensure it ends with /api
const getBaseURL = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) {
    return '/api';
  }
  // Strip trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');
  // Ensure it ends with /api
  if (!envUrl.endsWith('/api')) {
    envUrl = `${envUrl}/api`;
  }
  return envUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: ensure baseURL has /api and attach JWT auth headers
api.interceptors.request.use((config) => {
  // Ensure config.baseURL is properly normalized
  if (config.baseURL) {
    let base = config.baseURL.trim().replace(/\/+$/, '');
    if (!base.endsWith('/api') && !base.includes('/api/')) {
      config.baseURL = `${base}/api`;
    } else {
      config.baseURL = base;
    }
  }

  const isAdminReq = config.url && config.url.includes('/admin');

  if (isAdminReq) {
    const adminToken = localStorage.getItem('seekers_admin_token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    const userToken = localStorage.getItem('seekers_token') || localStorage.getItem('sadhana_token');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthLoginReq = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/admin/login');

    if (error.response?.status === 401 && !isAuthLoginReq) {
      const isAdminReq = error.config?.url?.includes('/admin');
      if (isAdminReq) {
        localStorage.removeItem('seekers_admin_token');
        localStorage.removeItem('seekers_admin_user');
      } else {
        localStorage.removeItem('seekers_token');
        localStorage.removeItem('seekers_user');
        localStorage.removeItem('sadhana_token');
        localStorage.removeItem('sadhana_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
