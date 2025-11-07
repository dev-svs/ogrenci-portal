import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (rawUser && token) {
      try { setUser(JSON.parse(rawUser)); } catch {}
    }
  }, []);

  // BE /api/auth/login ==> { emailOrUsername, password } (JSON)
  const login = async (emailOrUsername, password) => {
    const body = {
      emailOrUsername: (emailOrUsername || '').trim(),
      password: (password || '').trim(),
    };
    const { data } = await api.post('/api/auth/login', body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!data?.token || !data?.user) {
      throw new Error('Login cevabı beklenen formatta değil: { token, user }');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
