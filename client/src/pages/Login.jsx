import { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [emailOrUsername, setId] = useState('');
  const [password, setPw] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await api.post('/api/auth/login', { emailOrUsername, password });
      login(data.user, data.token);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.message || 'Giriş başarısız');
    }
  };

  return (
    <Container style={{ maxWidth: 420 }}>
      <Card>
        <Card.Body>
          <Card.Title>Giriş Yap</Card.Title>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Kullanıcı adı veya E-posta</Form.Label>
              <Form.Control value={emailOrUsername} onChange={e=>setId(e.target.value)} required/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Şifre</Form.Label>
              <Form.Control type="password" value={password} onChange={e=>setPw(e.target.value)} required/>
            </Form.Group>
            {err && <div className="text-danger mb-2">{err}</div>}
            <Button type="submit" className="w-100">Giriş</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
