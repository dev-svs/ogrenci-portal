import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
});

// Auth header: /api/auth/* isteklerinde ekleme!
api.interceptors.request.use((config) => {
  const isAuthPath = config.url && config.url.startsWith('/api/auth/');
  const token = localStorage.getItem('token');
  if (token && !isAuthPath) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const s = err.response?.status;
    // Login sayfasındayken redirect yapma
    const onLoginPage = location.pathname.startsWith('/login');
    if ((s === 401 || s === 403) && !onLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
