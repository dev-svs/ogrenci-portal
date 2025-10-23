import { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await api.post('/api/auth/register', { username, email, password, roles: ['student'] });
      setOk('Kayıt başarılı, giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(()=>navigate('/login'), 900);
    } catch (e) {
      setErr(e.response?.data?.message || 'Kayıt başarısız');
    }
  };

  return (
    <Container style={{ maxWidth: 480 }}>
      <Card>
        <Card.Body>
          <Card.Title>Kayıt Ol</Card.Title>
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Kullanıcı Adı</Form.Label>
              <Form.Control value={username} onChange={e=>setU(e.target.value)} required/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>E-posta</Form.Label>
              <Form.Control type="email" value={email} onChange={e=>setE(e.target.value)} required/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Şifre</Form.Label>
              <Form.Control type="password" value={password} onChange={e=>setP(e.target.value)} required/>
            </Form.Group>
            {err && <div className="text-danger mb-2">{err}</div>}
            {ok && <div className="text-success mb-2">{ok}</div>}
            <Button type="submit" className="w-100">Kayıt Ol</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
