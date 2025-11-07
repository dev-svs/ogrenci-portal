// client/src/components/TopNav.jsx
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function TopNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <>
      <Navbar bg="light" expand="lg" className="border-bottom shadow-sm">
        <Container>
          {/* Sol taraf: Site adı */}
          <Navbar.Brand as={NavLink} to="/dashboard">
            <strong>Öğrenci Portalı</strong>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="nav" />
          <Navbar.Collapse id="nav">
            {/* Orta kısım: Sekmeler */}
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/dashboard/uc1">Etkinlikler</Nav.Link>
              <Nav.Link as={NavLink} to="/dashboard/uc2">Kulüpler</Nav.Link>
              <Nav.Link as={NavLink} to="/dashboard/uc3">Öneriler</Nav.Link>
              <Nav.Link as={NavLink} to="/dashboard/uc4">Sınav Takvimi</Nav.Link>
              <Nav.Link as={NavLink} to="/dashboard/uc5">Danışman</Nav.Link>
              <Nav.Link as={NavLink} to="/dashboard/uc6">Randevular</Nav.Link>
            </Nav>

            {/* Sağ taraf: Kullanıcı + Çıkış */}
            <div className="d-flex align-items-center gap-2">
              {user && (
                <>
                  <span className="text-muted small">
                    {user.username || user.email}
                  </span>
                  {(user.roles || []).map((r) => (
                    <Badge bg="secondary" key={r}>{r}</Badge>
                  ))}
                </>
              )}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
              >
                Çıkış Yap
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
