import axios from 'axios';

// Gunakan URL backend dari env, fallback ke port 3001
const API_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api` 
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor Request: Otomatis sisipkan token JWT di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Tangani error global (terutama 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika server merespon dengan 401 (token kadaluwarsa/salah)
    if (error.response && error.response.status === 401) {
      console.warn('[API Interceptor] Token expired atau invalid. Mengarahkan ke /login...');
      
      // Hapus token di sisi client
      localStorage.removeItem('token');
      
      // Jika user sedang tidak di halaman login, redirect ke halaman login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
