import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Verifikasi token saat pertama kali aplikasi dibuka
  useEffect(() => {
    const checkTokenOnMount = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Token akan otomatis tersemat melalui request interceptor di services/api.js
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            // Bersihkan jika verifikasi gagal
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('[AuthContext] Gagal memverifikasi token:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkTokenOnMount();
  }, []);

  // Handler Login
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login gagal.' 
        };
      }
    } catch (error) {
      console.error('[AuthContext] Error saat login:', error);
      const message = error.response?.data?.message || 'Gagal terhubung ke server.';
      return { success: false, message };
    }
  };

  // Handler Logout
  const logout = async () => {
    try {
      // Hubungi backend untuk invalidasi token (opsional)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] Gagal logout di backend:', error);
    } finally {
      // Selalu bersihkan localStorage dan state di frontend
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
