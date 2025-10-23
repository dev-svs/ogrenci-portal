import React from 'react'
import ReactDOM from 'react-dom/client' //uygulamanın temelini oluşturuyor. Fronted
import App from './App.jsx' //projenin ana bileşeni, yani bütün sayfaları yöneten dosya.
import { BrowserRouter } from 'react-router-dom' //sayfalar arasında yönlendirme yapmayı sağlayan yapı.
import AuthProvider from './auth/AuthContext.jsx' //kullanıcı oturum yönetimini (login/logout) global hale getiren bileşen.
import 'bootstrap/dist/css/bootstrap.min.css' //Bootstrap kütüphanesinin CSS dosyası, uygulamanın tasarımını düzenliyor.

ReactDOM.createRoot(document.getElementById('root')).render( //Render edilen yapılar
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
