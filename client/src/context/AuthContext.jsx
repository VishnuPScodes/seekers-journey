import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sadhana_user');
    const token = localStorage.getItem('sadhana_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Refresh user data from server to get latest score/level
      api.get('/user/me').then(({ data }) => {
        const updated = JSON.parse(stored);
        updated.totalCumulativeScore = data.totalCumulativeScore || 0;
        updated.currentLevel = data.currentLevel || 1;
        setUser(updated);
        localStorage.setItem('sadhana_user', JSON.stringify(updated));
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sadhana_token', data.token);
    localStorage.setItem('sadhana_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('sadhana_token', data.token);
    localStorage.setItem('sadhana_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('sadhana_user', JSON.stringify(updated));
  };

  const logout = () => {
    localStorage.removeItem('sadhana_token');
    localStorage.removeItem('sadhana_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
