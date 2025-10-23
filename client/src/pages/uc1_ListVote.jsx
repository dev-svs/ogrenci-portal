import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Row, Col, Card, Button, Form, Table, Alert } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';

export default function UC1() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [names, setNames] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const isAdmin = user?.roles?.includes('admin');

  const loadAll = async () => {
    const [i, s, n] = await Promise.all([
      api.get('/api/uc1/items'),
      api.get('/api/uc1/votes/summary'),
      api.get('/api/uc1/names'),
    ]);
    setItems(i.data);
    setSummary(s.data);
    setNames(n.data);
  };

  useEffect(() => { loadAll().catch(() => {}); }, []);

  const onCreateItem = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/uc1/items', { title, description: desc });
      setTitle(''); setDesc('');
      await loadAll();
      setMsg('Öğe eklendi.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Hata');
    }
  };

  const onVote = async (itemId) => {
    setMsg('');
    try {
      const { data } = await api.post('/api/uc1/vote', { itemId });
      setSummary(data.summary);
      setMsg('Oyunuz kaydedildi.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Oy hatası');
    }
  };

  const onUploadCsv = async (e) => {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) return setMsg('CSV seçin');
    const fd = new FormData();
    fd.append('file', fileRef.current.files[0]);
    try {
      await api.post('/api/uc1/names/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      fileRef.current.value = '';
      await loadAll();
      setMsg('İsimler yüklendi.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Yükleme hatası');
    }
  };

  const exportCsv = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/uc1/names/export`;
  };

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Oylanabilir Öğeler</Card.Title>
              <Table hover size="sm" className="align-middle">
                <thead>
                  <tr><th>ID</th><th>Başlık</th><th>Açıklama</th><th>Oy</th></tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td>{it.title}</td>
                      <td className="text-muted">{it.description || '-'}</td>
                      <td><Button size="sm" onClick={() => onVote(it.id)}>Oy Ver</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6 className="mt-3">Özet</h6>
              <Table bordered size="sm">
                <thead><tr><th>ID</th><th>Başlık</th><th>Toplam Oy</th></tr></thead>
                <tbody>
                  {summary.map(s => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.title}</td>
                      <td>{s.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          {isAdmin && (
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Admin: Yeni Öğe Ekle</Card.Title>
                <Form onSubmit={onCreateItem}>
                  <Row className="g-2">
                    <Col md={5}><Form.Control placeholder="Başlık" value={title} onChange={e=>setTitle(e.target.value)} required/></Col>
                    <Col md={5}><Form.Control placeholder="Açıklama" value={desc} onChange={e=>setDesc(e.target.value)} /></Col>
                    <Col md={2}><Button type="submit" className="w-100">Ekle</Button></Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Body>
              <Card.Title>İsim Listesi</Card.Title>

              {isAdmin && (
                <Form onSubmit={onUploadCsv} className="mb-3">
                  <Row className="g-2 align-items-center">
                    <Col><Form.Control type="file" accept=".csv,text/csv" ref={fileRef} /></Col>
                    <Col xs="auto"><Button type="submit">CSV Yükle</Button></Col>
                    <Col xs="auto"><Button variant="outline-secondary" onClick={exportCsv}>CSV İndir</Button></Col>
                  </Row>
                  <div className="small text-muted mt-1">Her satıra bir isim. Maks 10 MB.</div>
                </Form>
              )}

              {!isAdmin && (
                <div className="mb-2">
                  <Button size="sm" variant="outline-secondary" onClick={exportCsv}>CSV İndir</Button>
                </div>
              )}

              <Table striped hover size="sm">
                <thead><tr><th>#</th><th>İsim</th><th>Eklenme</th></tr></thead>
                <tbody>
                  {names.map(n => (
                    <tr key={n.id}>
                      <td>{n.id}</td>
                      <td>{n.full_name}</td>
                      <td className="text-muted">{new Date(n.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
