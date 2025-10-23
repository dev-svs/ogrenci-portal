// client/src/auth/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? safeParse(u) : null;
  });

  const login = (userObj, token) => {
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('token', token);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
