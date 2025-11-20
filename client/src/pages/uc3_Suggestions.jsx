// client/src/pages/uc3_Suggestions.jsx
import { useState, useRef } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import api from '../api/axios';
import { useAutoDismiss } from '../utils/ui';



export default function UC3_Suggestions() {
  const [category, setCategory] = useState('GENEL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState('');
  useAutoDismiss(msg, setMsg, 3000); // 3 saniye sonra mesajı temizle


  // file input'a direkt erişmek için ref
  const fileInputRef = useRef(null);

  const send = async (e) => {
    e.preventDefault();
    setMsg('');

    // basit validation
    if (!title.trim() || !description.trim()) {
      setMsg('Başlık ve açıklama zorunludur.');
      return;
    }

    const form = new FormData();
    form.append('category', category);
    form.append('title', title);
    form.append('description', description);
    form.append('is_anonymous', anon ? 1 : 0);

    // anonimse email göndermiyoruz
    if (!anon && email.trim()) {
      form.append('email', email.trim());
    }

    // 🔑 sadece gerçekten dosya varsa append et
    if (file) {
      form.append('file', file);
    }

    try {
      await api.post('/api/suggestions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMsg('Öneriniz başarıyla gönderildi.');

      // formu temizle
      setTitle('');
      setDescription('');
      setEmail('');
      setAnon(false);
      setFile(null);

      // input[type=file] değerini de temizle ki
      // aynı dosyayı seçince bile onChange tekrar çalışsın
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.message || 'Gönderilemedi.');
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Geri Bildirim / Öneri Gönder</Card.Title>

        {msg && (
          <Alert variant="info" onClose={() => setMsg('')} dismissible>
            {msg}
          </Alert>
        )}

        <Form onSubmit={send}>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="GENEL">Genel</option>
                <option value="ONERI">Öneri &amp; İyileştirme</option>
                <option value="TEKNIK">Teknik Sorun / Hata Bildirimi</option>
              </Form.Select>
            </Col>

            <Col md={8}>
              <Form.Label>Başlık *</Form.Label>
              <Form.Control
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kısa ve net bir başlık"
                required
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Açıklama *</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Önerinizi detaylandırın..."
              required
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>Dosya (opsiyonel)</Form.Label>
              <Form.Control
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </Col>

            <Col md={6}>
              <Form.Label>E-posta (isteğe bağlı)</Form.Label>
              <Form.Control
                value={email}
                disabled={anon}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@universite.edu.tr"
              />
            </Col>
          </Row>

          <Form.Check
            className="mb-3"
            type="checkbox"
            label="Anonim Gönder"
            checked={anon}
            onChange={(e) => {
              const v = e.target.checked;
              setAnon(v);
              if (v) {
                // anonim seçilince email'i de temizle
                setEmail('');
              }
            }}
          />

          <div className="d-flex gap-2">
            <Button type="submit">Öneriyi Gönder</Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setTitle('');
                setDescription('');
                setEmail('');
                setAnon(false);
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Temizle
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
