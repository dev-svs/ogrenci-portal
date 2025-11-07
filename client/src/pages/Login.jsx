import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [id, setId] = useState(''); // kullanıcı adı veya e-posta
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await login(id, pw);
      nav('/dashboard', { replace: true });
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message || 'Giriş başarısız';
      setMsg(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Giriş Yap</Card.Title>
              {msg && <Alert variant="danger">{msg}</Alert>}
              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>E-posta veya Kullanıcı Adı</Form.Label>
                  <Form.Control value={id} onChange={(e)=>setId(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control type="password" value={pw} onChange={(e)=>setPw(e.target.value)} required />
                </Form.Group>
                <Button type="submit" className="w-100" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
