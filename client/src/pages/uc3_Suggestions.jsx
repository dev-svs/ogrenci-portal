import { useState } from "react";
import { Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import api from "../api/axios";

export default function Suggestions() {
  const [category, setCategory] = useState("GENEL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState("");

  const send = async (e) => {
    e.preventDefault();
    const form = new FormData();

    form.append("category", category);
    form.append("title", title);
    form.append("description", description);
    form.append("file", file);
    form.append("email", email);
    form.append("is_anonymous", anon ? 1 : 0);

    try {
      await api.post("/api/suggestions", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("Öneriniz başarıyla gönderildi.");
      setTitle("");
      setDescription("");
      setFile(null);
      setEmail("");
      setAnon(false);
    } catch (err) {
      setMsg("Gönderilemedi.");
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Geri Bildirim / Öneri Gönder</Card.Title>

        {msg && (
          <Alert variant="info" onClose={() => setMsg("")} dismissible>
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
                <option value="ONERI">Öneri & İyileştirme</option>
                <option value="TEKNIK">Teknik Sorun / Hata</option>
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
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Col>

            <Col md={6}>
              <Form.Label>E-posta (anonim değilse)</Form.Label>
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
            onChange={(e) => setAnon(e.target.checked)}
          />

          <div className="d-flex gap-2">
            <Button type="submit">Öneriyi Gönder</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTitle("");
                setDescription("");
                setEmail("");
                setFile(null);
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
