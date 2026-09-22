import axios from 'axios';

// Normalize baseURL: strip trailing slashes and ensure it ends with /api
const getBaseURL = () => {
  let raw = (import.meta.env.VITE_API_URL || '/api').trim();
  raw = raw.replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request (with graceful admin token isolation)
api.interceptors.request.use((config) => {
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
