import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Feeds from './pages/Feeds';

// Layout terproteksi untuk mengemas Navbar
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-container">
        {children}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Route Login - jika sudah login akan dialihkan ke dashboard */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Route Terproteksi */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/history" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <History />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/analytics" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Analytics />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/settings" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Settings />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      <Route 
        path="/feeds" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <Feeds />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Redirect semua url tak dikenal ke dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
