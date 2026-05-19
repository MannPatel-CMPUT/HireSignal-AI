import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/me`,
        { withCredentials: true }
      );
      setUser(data);
    } catch (error) {
      // Try to refresh the token before giving up
      try {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/me`,
          { withCredentials: true }
        );
        setUser(data);
      } catch {
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(data);
    return data;
  };

  const register = async (email, password, name) => {
    const { data } = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
      { email, password, name },
      { withCredentials: true }
    );
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;