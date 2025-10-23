import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000', 
  /* baseURL olarak .env dosyasındaki 
  VITE_API_BASE değerini alır, 
  eğer yoksa http://localhost:5000 adresine bağlanır.
  */
  withCredentials: false
});  //özel bir api nesnesi oluşturma

// Request interceptor: JWT ekle
api.interceptors.request.use((config) => { //burası her istek öncesi çalışır.
  const token = localStorage.getItem('token'); // login sonrası kaydedeceğiz
  if (token) config.headers.Authorization = `Bearer ${token}`; //localstorage içindeki JWT token’ı alır
  return config;
});

export default api;
//Bu alanda backend port değerini ve userkimlik doğrulama işlemleri yapılıyor