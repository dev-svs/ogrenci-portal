import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
  withCredentials: false
});

// Request interceptor: JWT ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // login sonrası kaydedeceğiz
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
