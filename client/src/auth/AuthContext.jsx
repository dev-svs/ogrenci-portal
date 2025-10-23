/*Bu dosya, React Context API kullanarak uygulamanın genelinde oturum 
(login/logout) bilgisini yönetir.*/

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null); //ile AuthContext olusturulur
export const useAuth = () => useContext(AuthContext);

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

export default function AuthProvider({ children }) { //çocuk bilesenlere 
  const [user, setUser] = useState(() => {           //kullanıcı bilgisini saklar.
    const u = localStorage.getItem('user');
    return u ? safeParse(u) : null;
  });

  const login = (userObj, token) => {
    localStorage.setItem('user', JSON.stringify(userObj));
    localStorage.setItem('token', token);
    setUser(userObj);
  }; //kullanıcı verisini ve jwt tokeni lclstrg e kaydeder.

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 
    setUser(null); //bilgileri siler oturumu kapatır
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// kimlik yönetim merkezi
// giriş, çıkış, oturum bilgisini kontrol eder.