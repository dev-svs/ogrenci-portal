import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Table, Alert } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

export default function UC2() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('clubadmin');

  const [clubs, setClubs] = useState([]);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const load = async () => {
    const { data } = await api.get('/api/clubs');
    setClubs(data);
  };

  useEffect(() => { load().catch(()=>{}); }, []);

  const join = async (id) => {
    setMsg('');
    try { await api.post('/api/clubs/join', { clubId: id }); await load(); setMsg('Kulübe katıldınız.'); }
    catch (e) { setMsg(e.response?.data?.message || 'Katılım hatası'); }
  };

  const leave = async (id) => {
    setMsg('');
    try { await api.post('/api/clubs/leave', { clubId: id }); await load(); setMsg('Kulüpten ayrıldınız.'); }
    catch (e) { setMsg(e.response?.data?.message || 'Ayrılma hatası'); }
  };

  const createClub = async (e) => {
    e.preventDefault();
    setMsg('');
    try { 
      await api.post('/api/clubs', { name, description: desc });
      setName(''); setDesc(''); await load(); setMsg('Kulüp oluşturuldu.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Oluşturma hatası');
    }
  };

  const filtered = clubs.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Kulüpler</Card.Title>

              <InputGroup className="mb-3">
                <InputGroup.Text>Ara</InputGroup.Text>
                <Form.Control placeholder="Kulüp adı..." value={filter} onChange={e=>setFilter(e.target.value)}/>
              </InputGroup>

              <Table hover responsive>
                <thead>
                  <tr><th>#</th><th>Ad</th><th>Açıklama</th><th>Üyelik</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.name}</td>
                      <td className="text-muted">{c.description || '-'}</td>
                      <td>
                        {c.is_member ? (
                          <Button size="sm" variant="outline-danger" onClick={()=>leave(c.id)}>Ayrıl</Button>
                        ) : (
                          <Button size="sm" onClick={()=>join(c.id)}>Katıl</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={4} className="text-center text-muted">Kayıt yok</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {isAdmin && (
            <Card>
              <Card.Body>
                <Card.Title>Yönetici: Yeni Kulüp</Card.Title>
                <Form onSubmit={createClub}>
                  <Form.Group className="mb-2">
                    <Form.Label>Kulüp Adı</Form.Label>
                    <Form.Control value={name} onChange={e=>setName(e.target.value)} required/>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Açıklama</Form.Label>
                    <Form.Control value={desc} onChange={e=>setDesc(e.target.value)} />
                  </Form.Group>
                  <Button type="submit">Oluştur</Button>
                </Form>
              </Card.Body>
            </Card>
          )}
          {!isAdmin && (
            <Card><Card.Body>
              <Card.Title>Bilgi</Card.Title>
              <p className="text-muted mb-0">
                Kulüp oluşturmak için <b>admin</b> veya <b>clubadmin</b> rolü gerekir.
              </p>
            </Card.Body></Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
