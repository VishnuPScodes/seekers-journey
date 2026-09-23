import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const OLD_TOKEN_KEY = 'sadhana_token';
const OLD_USER_KEY = 'sadhana_user';
const TOKEN_KEY = 'seekers_token';
const USER_KEY = 'seekers_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Graceful localStorage Key Migration ──
    let token = localStorage.getItem(TOKEN_KEY);
    let stored = localStorage.getItem(USER_KEY);

    if (!token && localStorage.getItem(OLD_TOKEN_KEY)) {
      token = localStorage.getItem(OLD_TOKEN_KEY);
      stored = localStorage.getItem(OLD_USER_KEY);
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (stored) localStorage.setItem(USER_KEY, stored);
      localStorage.removeItem(OLD_TOKEN_KEY);
      localStorage.removeItem(OLD_USER_KEY);
    }

    if (stored && token) {
      try {
        const parsedStored = JSON.parse(stored);
        if (
          parsedStored?.isSynthetic ||
          parsedStored?.email?.endsWith('@seekers.journey') ||
          parsedStored?.email?.endsWith('@synthetic.isha.demo')
        ) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(parsedStored);
        // Refresh user data from server to get latest score/level
        api.get('/user/me').then(({ data }) => {
          const currentStored = localStorage.getItem(USER_KEY);
          const parsed = currentStored ? JSON.parse(currentStored) : {};
          const updated = {
            ...parsed,
            ...data,
            practicesSelected: data.practicesSelected ?? (data.selectedPractices && data.selectedPractices.length > 0),
          };
          setUser(updated);
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to parse stored user profile:', err);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const switchPersona = async (personaId) => {
    const { data } = await api.post('/auth/switch-persona', { personaId });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(OLD_TOKEN_KEY);
    localStorage.removeItem(OLD_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
