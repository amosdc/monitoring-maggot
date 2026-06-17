import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Mapping nama halaman aktif untuk judul navbar
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Monitoring Dashboard';
      case '/history':
        return 'Data History Logs';
      case '/analytics':
        return 'Predictive Analytics';
      case '/settings':
        return 'System & Threshold Settings';
      case '/feeds':
        return 'Pakan Maggot';
      default:
        return 'BSF Farm Monitor';
    }
  };

  const handleLogoutClick = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <nav className="app-navbar">
      <div className="nav-brand">
        <div className="brand-logo">🐛</div>
        <div className="brand-info">
          <h1>Maggot Farm</h1>
          <span className="brand-sub">Mobile Computing Project</span>
        </div>
      </div>

      <div className="nav-title">
        <h2>{getPageTitle()}</h2>
      </div>

      <div className="nav-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          History
        </NavLink>
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Analytics
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Settings
        </NavLink>
        <NavLink 
          to="/feeds" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Pakan Maggot
        </NavLink>
      </div>

      <div className="nav-status-user">
        <div className="status-indicator">
          <span className={`pulse-dot ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isConnected ? 'Server Online' : 'Server Offline'}</span>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <span className="username">{user?.username || 'Admin'}</span>
            <span className="role">{user?.role || 'operator'}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogoutClick} title="Logout">
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
