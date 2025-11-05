// client/src/pages/uc6_Appointments.jsx
import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

function toLocal(dtUtcStr) {
  const d = new Date(dtUtcStr);
  return d.toLocaleString();
}
function utcToLocalInput(dtUtcStr) {
  // "YYYY-MM-DDTHH:mm" string (local input formatı)
  const d = new Date(dtUtcStr);
  const pad = (n) => String(n).padStart(2,'0');
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function UC6() {
  const { user } = useAuth();
  const isProvider =
    user?.roles?.includes('instructor') || user?.roles?.includes('student_affairs');

  // Listeleme filtreleri ve veriler
  const [scope, setScope] = useState('active'); // active | past | mine
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [rows, setRows]   = useState([]);

  // Bildirim
  const [msg, setMsg]     = useState('');

  // Randevu alma formu
  const [providers, setProviders]   = useState([]);
  const [providerId, setProviderId] = useState('');
  const [day, setDay]               = useState(''); // YYYY-MM-DD
  const [slots, setSlots]           = useState([]);
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal]     = useState('');
  const [topic, setTopic]           = useState('');

  // Sağlayıcı uygunluk yönetimi (sadece provider rolleri)
  const [myAvails, setMyAvails] = useState([]);
  const [aStart, setAStart]     = useState('');
  const [aEnd, setAEnd]         = useState('');
  const [aNote, setANote]       = useState('');

  /* ---------------------- Data Loaders ---------------------- */

  const loadAppts = async () => {
    const params = { scope, from: from || undefined, to: to || undefined };
    const { data } = await api.get('/api/appts', { params });
    setRows(data);
  };

  const loadProviders = async () => {
    const { data } = await api.get('/api/appts/providers');
    setProviders(data);
  };

  const loadSlots = async () => {
    setSlots([]);
    if (!providerId || !day) return;
    const { data } = await api.get('/api/appts/slots', {
      params: { provider_id: providerId, day, minutes: 30 },
    });
    setSlots(data);
  };

  const loadMyAvails = async () => {
    if (!isProvider) return;
    const { data } = await api.get('/api/appts/my-avails');
    setMyAvails(data);
  };

  useEffect(() => {
    loadAppts().catch(() => {});
    loadProviders().catch(() => {});
    if (isProvider) loadMyAvails().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSlots().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, day]);

  /* ---------------------- Actions ---------------------- */

  const search = async (e) => {
    e?.preventDefault();
    setMsg('');
    await loadAppts();
  };

  const pickSlot = (s) => {
    setStartLocal(utcToLocalInput(s.start_utc));
    setEndLocal(utcToLocalInput(s.end_utc));
  };

  const book = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/appts/book', {
        provider_id: Number(providerId),
        start_local: startLocal,
        end_local: endLocal,
        topic,
      });
      setTopic('');
      await loadAppts();
      await loadSlots();
      setMsg('Randevu oluşturuldu (e-posta bildirimi yapılandırılmışsa gönderildi).');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Randevu alma hatası');
    }
  };

  const cancel = async (id) => {
    if (!confirm('Randevuyu iptal etmek istediğine emin misin?')) return;
    setMsg('');
    try {
      await api.post('/api/appts/cancel', { id });
      await loadAppts();
      await loadSlots();
      setMsg('Randevu iptal edildi (e-posta bildirimi yapılandırılmışsa gönderildi).');
    } catch (err) {
      setMsg(err.response?.data?.message || 'İptal hatası');
    }
  };

  // Uygunluk paneli (provider)
  const createAvail = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/appts/my-avails', {
        start_local: aStart,
        end_local: aEnd,
        note: aNote,
      });
      setAStart(''); setAEnd(''); setANote('');
      await loadMyAvails();
      await loadSlots();
      setMsg('Uygunluk eklendi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Uygunluk eklenemedi');
    }
  };

  const deleteAvail = async (id) => {
    if (!confirm('Uygunluğu silmek istediğine emin misin?')) return;
    setMsg('');
    try {
      await api.delete(`/api/appts/my-avails/${id}`);
      await loadMyAvails();
      await loadSlots();
      setMsg('Uygunluk silindi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Silme hatası');
    }
  };

  /* ---------------------- Derived ---------------------- */

  const providerListFromRows = useMemo(() => {
    // Liste tablosundan da sağlayıcı türet; providers boş kalırsa fallback olur
    const m = new Map();
    rows.forEach((r) => m.set(r.provider_id, r.provider_name));
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [rows]);

  const effectiveProviders = providers.length
    ? providers.map((p) => ({ id: p.id, name: `${p.username} (${p.email})` }))
    : providerListFromRows;

  /* ---------------------- Render ---------------------- */

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        {/* SOL: Listeleme */}
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Randevular</Card.Title>

              <Form onSubmit={search} className="mb-3">
                <Row className="g-2 align-items-end">
                  <Col sm={3}>
                    <Form.Label>Liste</Form.Label>
                    <Form.Select value={scope} onChange={(e)=>setScope(e.target.value)}>
                      <option value="active">Aktif</option>
                      <option value="past">Geçmiş</option>
                      <option value="mine">Benimkiler</option>
                    </Form.Select>
                  </Col>
                  <Col sm={3}>
                    <Form.Label>Başlangıç</Form.Label>
                    <Form.Control type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
                  </Col>
                  <Col sm={3}>
                    <Form.Label>Bitiş</Form.Label>
                    <Form.Control type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
                  </Col>
                  <Col sm={3}>
                    <Button type="submit" className="w-100">Filtrele</Button>
                  </Col>
                </Row>
              </Form>

              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sağlayıcı</th>
                    <th>Öğrenci</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>Konu</th>
                    <th>Durum</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.provider_name}</td>
                      <td>{r.student_name}</td>
                      <td>{toLocal(r.start_utc)}</td>
                      <td>{toLocal(r.end_utc)}</td>
                      <td className="text-muted">{r.topic || '-'}</td>
                      <td>{r.status}</td>
                      <td className="text-end">
                        {r.status === 'booked' && (
                          <Button size="sm" variant="outline-danger" onClick={()=>cancel(r.id)}>İptal</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={8} className="text-center text-muted">Kayıt yok</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* SAĞ: Randevu alma + Uygunluk yönetimi */}
        <Col md={5}>
          <Card>
            <Card.Body>
              <Card.Title>Yeni Randevu Al</Card.Title>

              <Form onSubmit={book}>
                <Form.Group className="mb-2">
                  <Form.Label>Sağlayıcı</Form.Label>
                  <Form.Select
                    value={providerId}
                    onChange={(e)=>setProviderId(e.target.value)}
                    required
                  >
                    <option value="">Seçiniz...</option>
                    {effectiveProviders.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row className="g-2 mb-2">
                  <Col>
                    <Form.Label>Gün</Form.Label>
                    <Form.Control
                      type="date"
                      value={day}
                      onChange={(e)=>setDay(e.target.value)}
                      required
                    />
                  </Col>
                </Row>

                <div className="mb-2">
                  <div className="mb-1">Uygun Slotlar (30 dk)</div>
                  {slots.length ? (
                    <div className="d-flex flex-wrap gap-2">
                      {slots.map((s,i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline-primary"
                          onClick={()=>pickSlot(s)}
                          title={`${new Date(s.start_utc).toLocaleString()} - ${new Date(s.end_utc).toLocaleString()}`}
                        >
                          {new Date(s.start_utc).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          {' - '}
                          {new Date(s.end_utc).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">
                      Seçtiğiniz gün için uygun slot bulunamadı.
                    </div>
                  )}
                </div>

                <Row className="g-2 mb-2">
                  <Col>
                    <Form.Label>Başlangıç</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e)=>setStartLocal(e.target.value)}
                      required
                    />
                  </Col>
                  <Col>
                    <Form.Label>Bitiş</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e)=>setEndLocal(e.target.value)}
                      required
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Konu</Form.Label>
                  <Form.Control
                    value={topic}
                    onChange={(e)=>setTopic(e.target.value)}
                    placeholder="Kısa açıklama"
                  />
                </Form.Group>

                <Button type="submit">Randevu Al</Button>
              </Form>

              <div className="small text-muted mt-2">
                Slot’a tıklayınca saatler otomatik dolar. Saatler yerelde girilir, sunucuda UTC tutulur.
              </div>
            </Card.Body>
          </Card>

          {isProvider && (
            <Card className="mt-3">
              <Card.Body>
                <Card.Title>Uygunluk Yönetimi (Sağlayıcı)</Card.Title>

                <Form onSubmit={createAvail}>
                  <Row className="g-2 mb-2">
                    <Col>
                      <Form.Label>Başlangıç</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={aStart}
                        onChange={(e)=>setAStart(e.target.value)}
                        required
                      />
                    </Col>
                    <Col>
                      <Form.Label>Bitiş</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={aEnd}
                        onChange={(e)=>setAEnd(e.target.value)}
                        required
                      />
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Not</Form.Label>
                    <Form.Control
                      value={aNote}
                      onChange={(e)=>setANote(e.target.value)}
                      placeholder="ör. Ofis saatleri"
                    />
                  </Form.Group>
                  <Button type="submit">Uygunluk Ekle</Button>
                </Form>

                <hr/>

                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Başlangıç</th>
                      <th>Bitiş</th>
                      <th>Not</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAvails.map((a) => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{new Date(a.start_utc).toLocaleString()}</td>
                        <td>{new Date(a.end_utc).toLocaleString()}</td>
                        <td className="text-muted">{a.note || '-'}</td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={()=>deleteAvail(a.id)}
                          >
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!myAvails.length && (
                      <tr><td colSpan={5} className="text-center text-muted">Uygunluk yok</td></tr>
                    )}
                  </tbody>
                </Table>

                <div className="small text-muted">
                  Slotlar 30 dakikadır. Uygunluk blokları bu slotlara bölünür, dolu randevular elenir.
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
