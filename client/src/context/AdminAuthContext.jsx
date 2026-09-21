import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AdminAuthContext = createContext(null);

const ADMIN_TOKEN_KEY = 'seekers_admin_token';
const ADMIN_USER_KEY = 'seekers_admin_user';

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const stored = localStorage.getItem(ADMIN_USER_KEY);

    if (stored && token) {
      try {
        setAdminUser(JSON.parse(stored));
        // Verify with backend
        api.get('/admin/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ data }) => {
          setAdminUser(data.admin);
          localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
        }).catch(() => {
          // Token invalid
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
          setAdminUser(null);
        });
      } catch (err) {
        console.error('Failed to parse stored admin user:', err);
      }
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
    setAdminUser(data.admin);
    return data.admin;
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminUser(null);
  };

  const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, adminLogin, adminLogout, getAdminToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
