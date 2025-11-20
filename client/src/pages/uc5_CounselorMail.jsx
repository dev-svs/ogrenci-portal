// client/src/pages/uc5_CounselorMail.jsx
import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Alert,
  Modal,
} from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useAutoDismiss } from '../utils/ui';

// "2025-11-21 00:13:43" → "21.11.2025 00:13"
function formatCreatedAt(value) {
  if (!value) return '-';
  // beklenen format: "YYYY-MM-DD HH:MM:SS"
  const s = String(value);

  const datePart = s.slice(0, 10);     // "2025-11-21"
  const timePart = s.slice(11, 16);    // "00:13"

  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return s;        // beklediğimiz gibi değilse aynen göster

  return `${d}.${m}.${y} ${timePart}`;
}

export default function UC5_CounselorMail() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isCounselor = roles.includes('counselor');

  const [counselors, setCounselors] = useState([]);
  const [threads, setThreads] = useState([]);
  const [msg, setMsg] = useState('');
  useAutoDismiss(msg, setMsg, 3000);

  // compose (öğrenci tarafı)
  const [cId, setCId] = useState('');
  const [subject, setSubj] = useState('');
  const [body, setBody] = useState('');

  // view (modal)
  const [show, setShow] = useState(false);
  const [view, setView] = useState(null);

  const load = async () => {
    setMsg('');
    try {
      // Danışman listesi + tüm ilgili mesajlar (hem öğrenci hem danışman için)
      const [cs, th] = await Promise.all([
        api.get('/api/counsel/counselors'),
        api.get('/api/counsel/threads'),
      ]);
      setCounselors(cs.data || []);
      setThreads(th.data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Mesajlar yüklenemedi');
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const send = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/counsel/send', {
        counselor_id: Number(cId),
        subject,
        body,
      });
      setCId('');
      setSubj('');
      setBody('');
      await load();
      setMsg('Mesaj gönderildi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Gönderim hatası');
    }
  };

  const open = async (id) => {
    setMsg('');
    try {
      const { data } = await api.get(`/api/counsel/message/${id}`);
      setView(data);
      setShow(true);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Mesaj yüklenemedi');
    }
  };

  // öğrenci için kendi mesajları
  const studentThreads = threads.filter((t) => t.student_id === user?.id);

  // danışman için kendisine gelenler
  const counselorThreads = threads.filter((t) => t.counselor_id === user?.id);

  // modal içindeki "Kimden" yazısını role göre düzgün gösterelim
  const renderFromInfo = () => {
    if (!view) return '';
    const baseDate = formatCreatedAt(view.created_at);

    if (view.from_role === 'student') {
      // mesaj öğrenciden geldiyse
      if (isCounselor) {
        return `Gönderen: ${view.student_name} (öğrenci) · ${baseDate}`;
      }
      // öğrenci kendi mesajına bakıyorsa
      return `Gönderen: Ben · ${baseDate}`;
    } else {
      // mesaj danışmandan geldiyse
      if (isCounselor) {
        return `Gönderen: Ben · ${baseDate}`;
      }
      return `Gönderen: ${view.counselor_name} · ${baseDate}`;
    }
  };

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      {/* ÖĞRENCİ GÖRÜNÜMÜ: Mesaj Gönder + Mesajlarım */}
      {!isCounselor && (
        <Row className="g-3">
          <Col md={5}>
            <Card>
              <Card.Body>
                <Card.Title>Danışmana Mesaj Gönder</Card.Title>
                <Form onSubmit={send}>
                  <Form.Group className="mb-2">
                    <Form.Label>Danışman</Form.Label>
                    <Form.Select
                      value={cId}
                      onChange={(e) => setCId(e.target.value)}
                      required
                    >
                      <option value="">Seçiniz...</option>
                      {counselors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.username} ({c.email})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Konu</Form.Label>
                    <Form.Control
                      value={subject}
                      onChange={(e) => setSubj(e.target.value)}
                      maxLength={150}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Mesaj</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button type="submit">Gönder</Button>
                </Form>
                <div className="small text-muted mt-2">
                  Mesaj içeriği sistemde şifreli saklanır. E-postada içerik
                  paylaşılmaz; sadece bildirim gider.
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={7}>
            <Card>
              <Card.Body>
                <Card.Title>Mesajlarım</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Konu</th>
                      <th>Danışman</th>
                      <th>Kimden</th>
                      <th>Tarih</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentThreads.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.subject}</td>
                        <td>{t.counselor_name}</td>
                        <td>{t.from_role === 'student' ? 'Ben' : 'Danışman'}</td>
                        <td>
                          {formatCreatedAt(t.created_at)}
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => open(t.id)}
                          >
                            Görüntüle
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!studentThreads.length && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Mesaj yok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* DANIŞMAN GÖRÜNÜMÜ: Gelen Mesajlar */}
      {isCounselor && (
        <Card>
          <Card.Body>
            <Card.Title>Gelen Mesajlar</Card.Title>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Konu</th>
                  <th>Öğrenci</th>
                  <th>Kimden</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {counselorThreads.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.subject}</td>
                    <td>{t.student_name}</td>
                    <td>{t.from_role === 'student' ? 'Öğrenci' : 'Ben'}</td>
                    <td>{formatCreatedAt(t.created_at)}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => open(t.id)}
                      >
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
                {!counselorThreads.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      Mesaj yok
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Ortak modal (öğrenci + danışman) */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{view?.subject || 'Mesaj'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {view ? (
            <>
              <div className="mb-2 text-muted">{renderFromInfo()}</div>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{view.body}</pre>
            </>
          ) : (
            'Yükleniyor...'
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}