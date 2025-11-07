// client/src/pages/uc6_Appointments.jsx
import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, Badge, Spinner } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { toLocal, parseUtcLike, pad } from '../utils/time'; // 🔹 ortak zaman yardımcıları
import { useAutoDismiss } from '../utils/ui';


// Gün için 30 dk slotları üret (SABİT: 09:00–18:00)
function generateDaySlots(day, minutes=30) {
  if (!day) return [];
  const sH=9, sM=0, eH=18, eM=0;
  const slots = [];
  const start = new Date(`${day}T${pad(sH)}:${pad(sM)}:00`);
  const end   = new Date(`${day}T${pad(eH)}:${pad(eM)}:00`);
  for (let t = new Date(start); t < end; t = new Date(t.getTime() + minutes*60000)) {
    const t2 = new Date(t.getTime() + minutes*60000);
    slots.push({
      key: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
      label: `${pad(t.getHours())}:${pad(t.getMinutes())} - ${pad(t2.getHours())}:${pad(t2.getMinutes())}`,
      startLocal: `${day}T${pad(t.getHours())}:${pad(t.getMinutes())}`,
      endLocal:   `${day}T${pad(t2.getHours())}:${pad(t2.getMinutes())}`,
    });
  }
  return slots;
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
  useAutoDismiss(msg, setMsg, 3000);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Randevu alma formu
  const [providers, setProviders]   = useState([]);
  const [providerId, setProviderId] = useState('');
  const [day, setDay]               = useState(''); // YYYY-MM-DD
  const [available, setAvailable]   = useState([]); // [{start_utc,end_utc}]
  const [topic, setTopic]           = useState('');
  const [selected, setSelected]     = useState(null); // {startLocal,endLocal,label}

  // Sağlayıcı uygunluk yönetimi (sadece provider rolleri)
  const [myAvails, setMyAvails] = useState([]);
  const [aStart, setAStart]     = useState('');
  const [aEnd, setAEnd]         = useState('');
  const [aNote, setANote]       = useState('');

  /* ---------------------- Data Loaders ---------------------- */

  const loadAppts = async () => {setLoadingList(true);
  try {
    const params = { scope, from: from || undefined, to: to || undefined };
    const { data } = await api.get('/api/appts', { params });
    setRows(data);
  } finally {
    setLoadingList(false);
  }    
  };

  const loadProviders = async () => {setLoadingProviders(true);
  try {
    const { data } = await api.get('/api/appts/providers');
    setProviders(data);
  } finally {
    setLoadingProviders(false);
  }
    
  };

  const loadSlots = async () => {
    setAvailable([]);
  setSelected(null);
  if (!providerId || !day) return;
  setLoadingSlots(true);
  try {
    const { data } = await api.get('/api/appts/slots', {
      params: { provider_id: providerId, day, minutes: 30 },
    });
    setAvailable(data || []);
  } finally {
    setLoadingSlots(false);
  }
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

  const confirmBooking = async () => {
    if (!selected || !providerId) return;
    setMsg('');
    try {
      await api.post('/api/appts/book', {
        provider_id: Number(providerId),
        start_local: selected.startLocal,
        end_local: selected.endLocal,
        topic,
      });
      setTopic('');
      setSelected(null);
      await Promise.all([loadAppts(), loadSlots()]);
      setMsg(`Randevu oluşturuldu: ${selected.label}`);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Randevu alma hatası');
    }
  };

  const cancel = async (id) => {
    if (!confirm('Randevuyu iptal etmek istediğine emin misin?')) return;
    setMsg('');
    try {
      await api.post('/api/appts/cancel', { id });
      await Promise.all([loadAppts(), loadSlots()]);
      setMsg('Randevu iptal edildi.');
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
      await Promise.all([loadMyAvails(), loadSlots()]);
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
      await Promise.all([loadMyAvails(), loadSlots()]);
      setMsg('Uygunluk silindi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Silme hatası');
    }
  };

  /* ---------------------- Derived ---------------------- */

  // Günlük 30 dk’lık tüm slotlar
  const daySlots = useMemo(() => generateDaySlots(day, 30), [day]);

  // Backend’ten gelen uygun slotların set’i (UTC normalize)
  const availableSet = useMemo(() => {
    const set = new Set();
    for (const s of available) set.add(parseUtcLike(s.start_utc).toISOString());
    return set;
  }, [available]);

  // daySlots’u “uygun”/“değil” + “seçili” olarak işaretle
  const decoratedSlots = useMemo(() => {
      const now = new Date();
      const isToday = day && day === now.toISOString().slice(0,10);
      return daySlots.map(s => {
      const iso = new Date(s.startLocal).toISOString(); // local→UTC ISO
      const isFree = availableSet.has(iso);
      const isSelected = !!selected && selected.startLocal === s.startLocal;
      let isPast = false;
    if (isToday) {
      // s.startLocal yerel; şimdi ile kıyasla
      const localStart = new Date(s.startLocal);
      isPast = localStart.getTime() < now.getTime();
    }
    return { ...s, isFree, isSelected, isPast };
    });
  }, [daySlots, availableSet, selected]);

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
                    {loadingList ? (
                                 <tr><td colSpan={8} className="text-center">
                               <Spinner animation="border" size="sm" /> <span className="ms-2 text-muted">Yükleniyor...</span>
                              </td></tr>
                        ) : !rows.length && (
                    <tr><td colSpan={8} className="text-center text-muted">Kayıt yok</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* SAĞ: Slot Seç → Onayla + Uygunluk yönetimi */}
        <Col md={5}>
          <Card>
            <Card.Body>
              <Card.Title>Yeni Randevu Al</Card.Title>

              <Form className="mb-3">
                <Form.Group className="mb-2">
                  <Form.Label>Sağlayıcı</Form.Label>
                  <Form.Select
                    value={providerId}
                    onChange={(e)=>setProviderId(e.target.value)}
                    required
                  >
                    <option value="">{loadingProviders ? 'Yükleniyor...' : 'Seçiniz...'}</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.username} ({p.email})</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Gün</Form.Label>
                  <Form.Control
                    type="date"
                    value={day}
                    onChange={(e)=>setDay(e.target.value)}
                    required
                    min={new Date().toISOString().slice(0,10)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Konu</Form.Label>
                  <Form.Control
                    value={topic}
                    onChange={(e)=>setTopic(e.target.value)}
                    placeholder="Kısa açıklama (opsiyonel)"
                  />
                </Form.Group>
              </Form>

              <div className="mb-2 d-flex align-items-center gap-2">
                <Badge bg="success">Uygun</Badge>
                <Badge bg="secondary">Dolu / Uygun değil</Badge>
                <Badge bg="primary">Seçili</Badge>
              </div>

              {/* Slot grid */}
              <div className="d-flex flex-wrap gap-2">
                {loadingSlots ? (
                    <div className="text-muted"><Spinner animation="border" size="sm" /> <span className="ms-2">Slotlar yükleniyor...</span></div>
                   ) : decoratedSlots.length ? (
                  decoratedSlots.map((s) => {
                    const variant = s.isSelected ? 'primary' : (s.isFree ? 'success' : 'secondary');
                    const disabled = !s.isFree || !providerId || !day;
                    const finalDisabled = disabled || s.isPast;
                    return (
                      <Button
                        key={s.key}
                        size="sm"
                        variant={variant}
                        disabled={finalDisabled}
                        onClick={() => setSelected(s)}
                        title={s.label}
                      >
                        {s.label}
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-muted">Gün ve sağlayıcı seçiniz.</div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="small text-muted">
                  Slot seçtikten sonra onaylayın. Yerelde girilir, sunucu UTC tutar.
                </div>
                <Button
                  onClick={confirmBooking}
                  disabled={!selected || !providerId || !day}
                >
                  Randevuyu Onayla
                </Button>
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

                <Table hover responsive size="sm" className="align-middle">
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
                        <td>{toLocal(a.start_utc)}</td>
                        <td>{toLocal(a.end_utc)}</td>
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
