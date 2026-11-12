/**
 * src/context/AuthContext.js
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeToken, getToken, removeToken, storeUser, getUser, removeUser, clearAllCache } from '../utils/storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [authError,    setAuthError]    = useState(null);

  // Rehydrate on app start
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([getToken(), getUser()]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (e) {
        console.error('Auth bootstrap error:', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const register = async (full_name, email, phone, password) => {
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/register', { full_name, email, phone, password });
      await _persist(data.data.token, data.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await _persist(data.data.token, data.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    await removeToken();
    await removeUser();
    await clearAllCache();
    setToken(null);
    setUser(null);
  };

  const updateUserLocal = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    storeUser({ ...user, ...updatedUser });
  };

  const _persist = async (t, u) => {
    await storeToken(t);
    await storeUser(u);
    setToken(t);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, register, login, logout, updateUserLocal, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
