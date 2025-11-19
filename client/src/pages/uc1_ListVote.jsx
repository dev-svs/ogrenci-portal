// client/src/pages/uc1_ListVote.jsx
import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, InputGroup, Modal } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { toLocal } from '../utils/time'; // 🔹 ortak zaman yardımcıları
import { useAutoDismiss } from '../utils/ui';

// Güvenli sayı yardımcıları
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const fmt2 = (v) => num(v).toFixed(2);

const Star = ({ filled }) => (
  <span style={{ fontSize: 18, color: filled ? '#f5c518' : '#ccc' }}>★</span>
);

export default function UC1() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('clubadmin');
  const isStudent = user?.roles?.includes('student');
  const canDownloadCsv = !isStudent;

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  

  // Etkinlikler
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  // Katılımcı modal
  const [showAtt, setShowAtt] = useState(false);
  const [attTitle, setAttTitle] = useState('');
  const [attRows, setAttRows] = useState([]);
  const [attEventId, setAttEventId] = useState(null);

  // Etkinlik oluştur (admin)
  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Arama
  const [qUp, setQUp] = useState('');
  const [qPast, setQPast] = useState('');

 const loadEvents = async () => {
   setLoading(true);
   try {
     const [u, p] = await Promise.all([
       api.get('/api/events', { params: { scope: 'upcoming' } }),
       api.get('/api/events', { params: { scope: 'past' } })
     ]);
     setUpcoming(u.data || []);
     setPast(p.data || []);
   } finally {
     setLoading(false);
   }
 };

  const loadAttendees = async (eventId, title) => {
    const { data } = await api.get(`/api/events/${eventId}/attendees`);
    setAttRows(data || []);
    setAttTitle(title || 'Katılımcılar');
    setAttEventId(eventId);
    setShowAtt(true);
  };

  useEffect(() => { loadEvents().catch(() => {}); }, []);
  useAutoDismiss(msg, setMsg, 3000);

  const createEvent = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/events', { title, start_local: startLocal, location, description });
      setTitle(''); setStartLocal(''); setLocation(''); setDescription('');
      await loadEvents();
      setMsg('Etkinlik oluşturuldu.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Oluşturma hatası');
    }
  };

  const rsvp = async (id) => {
    setMsg('');
    try {
      await api.post(`/api/events/${id}/rsvp`);
      await loadEvents();
      setMsg('Etkinliğe katılımınız kaydedildi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Katılım hatası');
    }
  };

  const unrsvp = async (id) => {
    setMsg('');
    try {
      await api.delete(`/api/events/${id}/rsvp`);
      await loadEvents();
      setMsg('Katılımınız kaldırıldı.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'İptal hatası');
    }
  };

  const rate = async (id, stars) => {
    setMsg('');
    try {
      await api.post(`/api/events/${id}/rate`, { stars });
      await loadEvents();
      setMsg('Oyunuz kaydedildi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Oylama hatası');
    }
  };

  const filteredUpcoming = qUp
    ? upcoming.filter(ev =>
        (ev.title || '').toLowerCase().includes(qUp.toLowerCase()) ||
        (ev.location || '').toLowerCase().includes(qUp.toLowerCase())
      )
    : upcoming;

  const filteredPast = qPast
    ? past.filter(ev =>
        (ev.title || '').toLowerCase().includes(qPast.toLowerCase()) ||
        (ev.location || '').toLowerCase().includes(qPast.toLowerCase())
      )
    : past;

    // Bugünün yerel zamanı için min değer (datetime-local uyumlu)
const now = new Date();
const tzOffsetMs = now.getTimezoneOffset() * 60000; // dakikayı ms’e çevir
const localNow = new Date(now.getTime() - tzOffsetMs);
const minDateTimeLocal = localNow.toISOString().slice(0, 16);


  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        {/* SOL: Yaklaşan Etkinlikler */}
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Yaklaşan Etkinlikler</Card.Title>

              <InputGroup className="mb-2">
                <InputGroup.Text>Ara</InputGroup.Text>
                <Form.Control
                  placeholder="Başlık / yer"
                  value={qUp}
                  onChange={(e)=>setQUp(e.target.value)}
                />
              </InputGroup>

              <Table hover responsive size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Başlık</th>
                    <th>Başlangıç</th>
                    <th>Yer</th>
                    <th>Katılımcı</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUpcoming.map((ev) => (
                    <tr key={ev.id}>
                      <td>{ev.id}</td>
                      <td>{ev.title}</td>
                      <td>{toLocal(ev.start_utc)}</td>
                      <td className="text-muted">{ev.location || '-'}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={()=>loadAttendees(ev.id, ev.title)}
                          title="Katılımcıları gör"
                        >
                          {ev.participant_count || 0} kişi
                        </Button>
                      </td>
                      <td className="text-end">
                        {ev.is_attended ? (
                          <Button size="sm" variant="outline-danger" onClick={()=>unrsvp(ev.id)}>
                            Vazgeç
                          </Button>
                        ) : (
                          <Button size="sm" onClick={()=>rsvp(ev.id)}>
                            Katıl
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  { loading ? (
                    <tr><td colSpan={6} className="text-center text-muted">Yükleniyor...</td></tr>
                    ) : !filteredUpcoming.length && (
      <tr><td colSpan={6} className="text-center text-muted">Kayıt yok</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Geçmiş Etkinlikler + Oylama */}
          <Card className="mt-3">
            <Card.Body>
              <Card.Title>Geçmiş Etkinlikler (Oylama)</Card.Title>

              <InputGroup className="mb-2">
                <InputGroup.Text>Ara</InputGroup.Text>
                <Form.Control
                  placeholder="Başlık / yer"
                  value={qPast}
                  onChange={(e)=>setQPast(e.target.value)}
                />
              </InputGroup>

              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Başlık</th>
                    <th>Tarih</th>
                    <th>Yer</th>
                    <th>Katılımcı</th>
                    <th>Ortalama</th>
                    <th>Benim Oyum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPast.map((e) => {
                    const my = num(e.my_stars, 0);
                    return (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.title}</td>
                        <td>{toLocal(e.start_utc)}</td>
                        <td className="text-muted">{e.location || '-'}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={()=>loadAttendees(e.id, e.title)}
                            title="Katılımcıları gör"
                          >
                            {e.participant_count || 0} kişi
                          </Button>
                        </td>
                        <td className="text-muted">
                          {fmt2(e.avg_stars)} ({e.rating_count || 0})
                        </td>
                        <td>
                          {e.is_attended ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {[1,2,3,4,5].map(s => (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant="link"
                                  className="p-0"
                                  onClick={()=>rate(e.id, s)}
                                  title={`${s} yıldız`}
                                >
                                  <Star filled={my >= s} />
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted small">Sadece katılanlar oy verebilir</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredPast.length && (
                    <tr><td colSpan={7} className="text-center text-muted">Kayıt yok</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* SAĞ: Yönetici etkinlik oluştur */}
        <Col md={5}>
          {isAdmin ? (
            <Card>
              <Card.Body>
                <Card.Title>Yönetici: Etkinlik Oluştur</Card.Title>
                <Form onSubmit={createEvent}>
                  <Form.Group className="mb-2">
                    <Form.Label>Başlık</Form.Label>
                    <Form.Control value={title} onChange={(e)=>setTitle(e.target.value)} required />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Başlangıç</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e)=>setStartLocal(e.target.value)}
                      required
                      min={minDateTimeLocal}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Yer</Form.Label>
                    <Form.Control value={location} onChange={(e)=>setLocation(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Açıklama</Form.Label>
                    <Form.Control value={description} onChange={(e)=>setDescription(e.target.value)} />
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
                  Etkinlik oluşturma yalnızca <b>admin/clubadmin</b> içindir.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Katılımcı Modal */}
      <Modal show={showAtt} onHide={()=>setShowAtt(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{attTitle || 'Katılımcılar'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table hover responsive size="sm" className="align-middle">
            <thead>
              <tr><th>#</th><th>Ad</th><th>E-posta</th><th>Kaydolma</th></tr>
            </thead>
            <tbody>
              {attRows.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td>{i + 1}</td>
                  <td>{r.username}</td>
                  <td className="text-muted">{r.email}</td>
                  <td className="text-muted">{toLocal(r.joined_at)}</td>
                </tr>
              ))}
              {!attRows.length && (
                <tr><td colSpan={4} className="text-center text-muted">Katılımcı yok</td></tr>
              )}
            </tbody>
          </Table>

          {canDownloadCsv && (
            <div className="text-end">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={()=>{
                  if (!attEventId) return;
                  window.location.href =
                    `${import.meta.env.VITE_API_BASE}/api/events/${attEventId}/attendees.csv`;
                }}
              >
                Katılımcıları CSV indir
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
