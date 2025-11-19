// client/src/components/TopNav.jsx
import { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function TopNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  // 🌗 Tema durumu
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <Navbar
      bg={theme === 'light' ? 'light' : 'dark'}
      variant={theme === 'light' ? 'light' : 'dark'}
      expand="lg"
      className="border-bottom shadow-sm"
    >
      <Container>
        {/* Sol: Site adı */}
        <Navbar.Brand as={NavLink} to="/dashboard">
          <strong>Öğrenci Portalı</strong>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          {/* Orta: Sekmeler */}
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/dashboard/uc1">Etkinlikler</Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard/uc2">Kulüpler</Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard/uc3">Öneriler</Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard/uc5">Danışman</Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard/uc6">Randevular</Nav.Link>
          </Nav>

          {/* Sağ kısım */}
          <div className="d-flex align-items-center gap-2">
            {user && (
              <span className="text-muted small">
                {user.username || user.email}
              </span>
            )}

            {/* Üç çizgi menü */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                ☰
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {user && (
                  <Dropdown.Header>
                    Rol: {(user.roles || []).join(', ') || 'Tanımsız'}
                  </Dropdown.Header>
                )}
                <Dropdown.Divider />
                <Dropdown.Item as={NavLink} to="/dashboard/profile">
                  Profil Bilgileri
                </Dropdown.Item>
                <Dropdown.Item as={NavLink} to="/dashboard/academic">
                  Akademik Bilgiler
                </Dropdown.Item>
                <Dropdown.Item as={NavLink} to="/dashboard/exams">
                  Sınav Takvimi
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Çıkış */}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleLogout}
            >
              Çıkış Yap
            </Button>

            {/* 🌗 Tema butonu en sağda */}
            <Button
              variant={theme === 'light' ? 'outline-dark' : 'outline-light'}
              size="sm"
              onClick={toggleTheme}
              title="Tema değiştir"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
