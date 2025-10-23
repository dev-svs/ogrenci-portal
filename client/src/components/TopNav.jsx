import { Navbar, Container, Nav, Button } from 'react-bootstrap'; //React-Bootstrap bileşenleri
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext'; // ile kullanıcı bilgisi ve logout fonksiyonu alınır

export default function TopNav() {
  const { user, logout } = useAuth(); 
  return (                            // react-bootstrap bileşenleriyle oluşturulur.
    <Navbar bg="light" expand="lg" className="mb-3 border-bottom"> 
      <Container>
        <Navbar.Brand as={Link} to="/">Öğrenci Portalı</Navbar.Brand>
        <Navbar.Toggle/>
        <Navbar.Collapse>
          <Nav className="me-auto">
            {user && <Nav.Link as={Link} to="/">Panel</Nav.Link>}
          </Nav>
          <Nav className="ms-auto">
            {user ? ( //) user varsa kullanıcıya özel menü
              <>
                <Navbar.Text className="me-2">Merhaba, <b>{user.username}</b></Navbar.Text>
                <Button variant="outline-danger" size="sm" onClick={logout}>Çıkış</Button>
              </> //logout butonuna basıldığında oturum kapatılır.
            ) : ( // yoksa giriş/kayıt linkleri gösterilir
              <>
                <Nav.Link as={Link} to="/login">Giriş</Nav.Link>
                <Nav.Link as={Link} to="/register">Kayıt Ol</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
