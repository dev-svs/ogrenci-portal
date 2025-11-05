// client/src/pages/uc1_ListVote.jsx
import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

function toLocal(dtUtcStr) {
  if (!dtUtcStr) return '-';
  const d = new Date(dtUtcStr);
  return isNaN(d) ? '-' : d.toLocaleString();
}

export default function UC1() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('clubadmin');

  // mesaj/uyarı
  const [msg, setMsg] = useState('');

  // İsim listesi
  const [names, setNames] = useState([]);
  const [q, setQ] = useState('');

  // Etkinlikler
  const [events, setEvents] = useState([]);

  // Etkinlik oluştur formu
  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  /* ---------------- Data Loaders ---------------- */

  const loadNames = async () => {
    const { data } = await api.get('/api/uc1/names');
    setNames(data || []);
  };

  const loadEvents = async () => {
    const { data } = await api.get('/api/events');
    setEvents(data || []);
  };

  useEffect(() => {
    Promise.all([loadNames(), loadEvents()]).catch(() => {});
  }, []);

  /* ---------------- Actions ---------------- */

  const downloadCsv = () => {
    // CSV yalnızca admin/clubadmin için görünür; backend ayrıca role check yapıyor.
    window.location.href = `${import.meta.env.VITE_API_BASE}/api/uc1/names.csv`;
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/events', {
        title,
        start_local: startLocal, // datetime-local (yerel), server UTC'ye çeviriyor
        location,
        description,
      });
      setTitle('');
      setStartLocal('');
      setLocation('');
      setDescription('');
      await loadEvents();
      setMsg('Etkinlik oluşturuldu.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Oluşturma hatası');
    }
  };

  /* ---------------- Derived ---------------- */

  const filteredNames = q
    ? names.filter((n) =>
        (n.username || '').toLowerCase().includes(q.toLowerCase()) ||
        (n.email || '').toLowerCase().includes(q.toLowerCase())
      )
    : names;

  /* ---------------- Render ---------------- */

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        {/* SOL SÜTUN: İSİM LİSTESİ + YAKLAŞAN ETKİNLİKLER */}
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>İsim Listesi</Card.Title>

              <InputGroup className="mb-2">
                <InputGroup.Text>Ara</InputGroup.Text>
                <Form.Control
                  placeholder="Ad / e-posta"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {isAdmin && (
                  <Button variant="outline-secondary" onClick={downloadCsv}>
                    CSV indir (Admin)
                  </Button>
                )}
              </InputGroup>

              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ad</th>
                    <th>E-posta</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNames.map((u, i) => (
                    <tr key={u.id ?? i}>
                      <td>{u.id ?? i + 1}</td>
                      <td>{u.username}</td>
                      <td className="text-muted">{u.email}</td>
                    </tr>
                  ))}
                  {!filteredNames.length && (
                    <tr>
                      <td colSpan={3} className="text-center text-muted">
                        Kayıt yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {!isAdmin && (
                <div className="small text-muted">
                  Not: CSV indirme yalnızca <b>admin/clubadmin</b> için yetkilidir.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <Card.Title>Yaklaşan Etkinlikler</Card.Title>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Başlık</th>
                    <th>Başlangıç</th>
                    <th>Yer</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.id}</td>
                      <td>{ev.title}</td>
                      <td>{toLocal(ev.start_utc)}</td>
                      <td className="text-muted">{ev.location || '-'}</td>
                    </tr>
                  ))}
                  {!events.length && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Kayıt yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* SAĞ SÜTUN: YÖNETİCİ ETKİNLİK OLUŞTUR */}
        <Col md={5}>
          {isAdmin ? (
            <Card>
              <Card.Body>
                <Card.Title>Yönetici: Etkinlik Oluştur</Card.Title>
                <Form onSubmit={createEvent}>
                  <Form.Group className="mb-2">
                    <Form.Label>Başlık</Form.Label>
                    <Form.Control
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Başlangıç</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e) => setStartLocal(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Yer</Form.Label>
                    <Form.Control
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Açıklama</Form.Label>
                    <Form.Control
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Form.Group>
                  <Button type="submit">Oluştur</Button>
                </Form>
                <div className="small text-muted mt-2">
                  Tarih/saat tarayıcı yerelinde girilir; sunucu UTC olarak kaydeder.
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <Card.Title>Bilgi</Card.Title>
                <p className="text-muted mb-0">
                  Etkinlik oluşturma ve CSV indirme yalnızca <b>admin/clubadmin</b> için
                  yetkilidir.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
