import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

function toLocal(dtUtcStr) {
  // dtUtcStr: "2025-10-25T10:00:00.000Z" veya "2025-10-25 10:00:00"
  const d = new Date(dtUtcStr.replace(' ', 'T') + (dtUtcStr.endsWith('Z')?'':'Z'));
  return d.toLocaleString(); // tarayıcı yereli (TR ise Europe/Istanbul)
}

export default function UC4() {
  const { user } = useAuth();
  const canManage = ['admin','instructor','student_affairs'].some(r => user?.roles?.includes(r));

  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  // filtreler
  const [mine, setMine] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  // yeni sınav
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [startLocal, setStartLocal] = useState(''); // datetime-local
  const [endLocal, setEndLocal] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const params = { mine, from: from || undefined, to: to || undefined, q: q || undefined };
    const { data } = await api.get('/api/exams', { params });
    setRows(data);
  };

  useEffect(() => { load().catch(()=>{}); }, []); // ilk yükleme

  const search = async (e) => {
    e?.preventDefault();
    setMsg('');
    await load();
  };

  const createExam = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/exams', {
        course_id: Number(courseId),
        title, start_local: startLocal, end_local: endLocal,
        location, notes
      });
      setCourseId(''); setTitle(''); setStartLocal(''); setEndLocal(''); setLocation(''); setNotes('');
      await load();
      setMsg('Sınav eklendi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Oluşturma hatası');
    }
  };

  const remove = async (id) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    setMsg('');
    try {
      await api.delete(`/api/exams/${id}`);
      await load();
      setMsg('Sınav silindi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Silme hatası');
    }
  };

  // hızlı ders listesi (rows içinden uniq)
  const courseList = useMemo(() => {
    const m = new Map();
    rows.forEach(r => m.set(r.course_id, `${r.code} - ${r.name}`));
    return Array.from(m, ([id, label]) => ({ id, label }));
  }, [rows]);

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Sınav Takvimi</Card.Title>

              <Form onSubmit={search} className="mb-3">
                <Row className="g-2 align-items-end">
                  <Col sm={3}>
                    <Form.Check
                      type="switch"
                      id="mine"
                      label="Sadece benim derslerim"
                      checked={mine}
                      onChange={e=>setMine(e.target.checked)}
                    />
                  </Col>
                  <Col sm={3}>
                    <Form.Label>Başlangıç (dahil)</Form.Label>
                    <Form.Control type="date" value={from} onChange={e=>setFrom(e.target.value)} />
                  </Col>
                  <Col sm={3}>
                    <Form.Label>Bitiş (dahil)</Form.Label>
                    <Form.Control type="date" value={to} onChange={e=>setTo(e.target.value)} />
                  </Col>
                  <Col sm={3}>
                    <Form.Label>Ara</Form.Label>
                    <InputGroup>
                      <Form.Control placeholder="ders/başlık" value={q} onChange={e=>setQ(e.target.value)} />
                      <Button type="submit" variant="primary">Filtre</Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Form>

              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>#</th><th>Ders</th><th>Başlık</th><th>Başlangıç</th><th>Bitiş</th><th>Yer</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.code} — {r.name}</td>
                      <td>{r.title}</td>
                      <td>{toLocal(r.start_utc)}</td>
                      <td>{toLocal(r.end_utc)}</td>
                      <td>{r.location || '-'}</td>
                      <td className="text-end">
                        {canManage && <Button size="sm" variant="outline-danger" onClick={()=>remove(r.id)}>Sil</Button>}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={7} className="text-center text-muted">Kayıt yok</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {canManage ? (
            <Card>
              <Card.Body>
                <Card.Title>Yönetici: Sınav Ekle</Card.Title>
                <Form onSubmit={createExam}>
                  <Form.Group className="mb-2">
                    <Form.Label>Ders</Form.Label>
                    <Form.Select value={courseId} onChange={e=>setCourseId(e.target.value)} required>
                      <option value="">Seçiniz...</option>
                      {courseList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </Form.Select>
                    <div className="form-text">Listede yoksa önce derse ait bir sınav listelensin diye en az bir satır çekmiş olman gerekir ya da UC-7’den ders ekleme gelecek.</div>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Başlık</Form.Label>
                    <Form.Control value={title} onChange={e=>setTitle(e.target.value)} required />
                  </Form.Group>
                  <Row className="mb-2 g-2">
                    <Col>
                      <Form.Label>Başlangıç</Form.Label>
                      <Form.Control type="datetime-local" value={startLocal} onChange={e=>setStartLocal(e.target.value)} required />
                    </Col>
                    <Col>
                      <Form.Label>Bitiş</Form.Label>
                      <Form.Control type="datetime-local" value={endLocal} onChange={e=>setEndLocal(e.target.value)} required />
                    </Col>
                  </Row>
                  <Form.Group className="mb-2">
                    <Form.Label>Yer</Form.Label>
                    <Form.Control value={location} onChange={e=>setLocation(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Not</Form.Label>
                    <Form.Control value={notes} onChange={e=>setNotes(e.target.value)} />
                  </Form.Group>
                  <Button type="submit">Ekle</Button>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Card><Card.Body>
              <Card.Title>Bilgi</Card.Title>
              <p className="text-muted mb-0">
                Sınav eklemek/silmek için <b>admin</b>, <b>instructor</b> veya <b>student_affairs</b> rolü gerekir.
              </p>
            </Card.Body></Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
