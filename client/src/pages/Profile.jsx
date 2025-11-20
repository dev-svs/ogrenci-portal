// client/src/pages/Profile.jsx
import { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import { useAutoDismiss } from '../utils/ui';

export default function Profile() {
  const { user } = useAuth();

  // Parola değiştirme state’leri
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwVariant, setPwVariant] = useState('info');
  const [showPwForm, setShowPwForm] = useState(false);

  useAutoDismiss(pwMsg, setPwMsg, 3000);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');

    if (newPass !== newPass2) {
      setPwVariant('danger');
      setPwMsg('Yeni şifre doğrulaması uyuşmuyor');
      return;
    }

    if (newPass.length < 3) {
      setPwVariant('danger');
      setPwMsg('Yeni şifre en az 3 karakter olmalıdır');
      return;
    }

    try {
      await api.post('/api/users/change-password', {
        oldPassword: oldPass,
        newPassword: newPass,
      });

      setOldPass('');
      setNewPass('');
      setNewPass2('');
      setPwVariant('success');
      setPwMsg('Şifre başarıyla güncellendi');
    } catch (err) {
      setPwVariant('danger');
      setPwMsg(err.response?.data?.message || 'Şifre değiştirilemedi');
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Profil Bilgileri</Card.Title>
        <div className="text-muted mb-3">
          Bu sayfa kullanıcının temel profil bilgilerini göstermek için ayrıldı.
        </div>

        <Row className="g-4">
          {/* Sol: temel bilgiler */}
          <Col md={6}>
            <div><b>Kullanıcı:</b> {user?.username || user?.email}</div>
            <div><b>E-posta:</b> {user?.email || '-'}</div>
            <div><b>Roller:</b> {(user?.roles || []).join(', ') || '-'}</div>
          </Col>

          {/* Sağ: parola değiştir (dar ve açılır kapanır) */}
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0"></h6>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setShowPwForm(v => !v)}
              >
                {showPwForm ? 'İptal' : 'Şifre Değişikliği'}
              </Button>
            </div>

            {showPwForm && (
              <div className="border rounded p-3 bg-light">
                {pwMsg && (
                  <Alert variant={pwVariant} className="py-2 mb-2">
                    {pwMsg}
                  </Alert>
                )}

                <Form onSubmit={handleChangePassword}>
                  <Form.Group className="mb-2">
                    <Form.Label className="mb-1">Mevcut Şifre</Form.Label>
                    <Form.Control
                      type="password"
                      size="sm"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label className="mb-1">Yeni Şifre</Form.Label>
                    <Form.Control
                      type="password"
                      size="sm"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="mb-1">Yeni Şifre (Tekrar)</Form.Label>
                    <Form.Control
                      type="password"
                      size="sm"
                      value={newPass2}
                      onChange={(e) => setNewPass2(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <div className="text-end">
                    <Button type="submit" size="sm">
                      Kaydet
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
