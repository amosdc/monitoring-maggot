import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="spinner"></div>
        <p>Memuat Sistem...</p>
      </div>
    );
  }

  // Jika tidak ada user, redirect ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
