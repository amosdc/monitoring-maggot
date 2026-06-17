import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi input
    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login gagal. Periksa kembali username dan password.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-glass-card">
        <div className="login-header">
          <h1>Maggot Farm</h1>
          <p>IoT Monitoring & Analytics System</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <span className="error-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Masukkan username admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner-inline">Memverifikasi...</span>
            ) : (
              'MASUK KE DASHBOARD'
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>Sistem Keamanan Terenkripsi JWT</span>
          <span className="seeder-tip">Default: admin | maggot2025</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
