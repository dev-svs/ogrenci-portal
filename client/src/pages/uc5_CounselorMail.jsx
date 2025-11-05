import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Form, Table, Alert, Modal } from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

export default function UC5() {
  const { user } = useAuth();
  const isCounselor = user?.roles?.includes('counselor');

  const [counselors, setCounselors] = useState([]);
  const [threads, setThreads] = useState([]);
  const [msg, setMsg] = useState('');

  // compose
  const [cId, setCId] = useState('');
  const [subject, setSubj] = useState('');
  const [body, setBody] = useState('');

  // view
  const [show, setShow] = useState(false);
  const [view, setView] = useState(null);

  const load = async () => {
    const [cs, th] = await Promise.all([
      api.get('/api/counsel/counselors'),
      api.get('/api/counsel/threads')
    ]);
    setCounselors(cs.data);
    setThreads(th.data);
  };

  useEffect(() => { load().catch(()=>{}); }, []);

  const send = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/counsel/send', { counselor_id: Number(cId), subject, body });
      setCId(''); setSubj(''); setBody('');
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

  return (
    <div>
      {msg && <Alert variant="info">{msg}</Alert>}

      <Row className="g-3">
        <Col md={5}>
          <Card>
            <Card.Body>
              <Card.Title>Danışmana Mesaj Gönder</Card.Title>
              <Form onSubmit={send}>
                <Form.Group className="mb-2">
                  <Form.Label>Danışman</Form.Label>
                  <Form.Select value={cId} onChange={e=>setCId(e.target.value)} required>
                    <option value="">Seçiniz...</option>
                    {counselors.map(c => <option key={c.id} value={c.id}>{c.username} ({c.email})</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Konu</Form.Label>
                  <Form.Control value={subject} onChange={e=>setSubj(e.target.value)} maxLength={150} required/>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mesaj</Form.Label>
                  <Form.Control as="textarea" rows={6} value={body} onChange={e=>setBody(e.target.value)} required/>
                </Form.Group>
                <Button type="submit">Gönder</Button>
              </Form>
              <div className="small text-muted mt-2">
                Mesaj içeriği sistemde şifreli saklanır. E-postada içerik paylaşılmaz; sadece bildirim gider.
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Mesajlarım</Card.Title>
              <Table hover responsive>
                <thead><tr><th>#</th><th>Konu</th><th>Danışman</th><th>Kimden</th><th>Tarih</th><th></th></tr></thead>
                <tbody>
                  {threads.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.subject}</td>
                      <td>{t.counselor_name}</td>
                      <td>{t.from_role === 'student' ? 'Ben' : 'Danışman'}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-secondary" onClick={()=>open(t.id)}>Görüntüle</Button>
                      </td>
                    </tr>
                  ))}
                  {!threads.length && <tr><td colSpan={6} className="text-center text-muted">Mesaj yok</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={show} onHide={()=>setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{view?.subject || 'Mesaj'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {view ? (
            <>
              <div className="mb-2 text-muted">
                {view.from_role === 'student' ? 'Gönderen: Ben' : `Gönderen: ${view.counselor_name}`}
                {' · '} {new Date(view.created_at).toLocaleString()}
              </div>
              <pre style={{whiteSpace:'pre-wrap'}}>{view.body}</pre>
            </>
          ) : 'Yükleniyor...'}
        </Modal.Body>
      </Modal>
    </div>
  );
}
