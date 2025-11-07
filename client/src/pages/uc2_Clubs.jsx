// client/src/pages/uc2_Clubs.jsx
import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Button, Form, InputGroup, Modal, Table, Alert, Badge, ListGroup
} from 'react-bootstrap';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useAutoDismiss } from '../utils/ui';

function toLocal(s) {
  const d = new Date(s);
  return isNaN(d) ? '-' : d.toLocaleString('tr-TR', { hour12: false });
}

export default function UC2_Clubs() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isStudent = roles.includes('student');
  const isAdmin   = roles.includes('admin');
  const isClubAdmin = roles.includes('clubadmin');

  // Üst mesaj barı (3 sn auto-dismiss)
  const [msg, setMsg] = useState('');
  useAutoDismiss(msg, setMsg, 3000);

  const [clubs, setClubs] = useState([]);
  const [q, setQ] = useState('');

  // Üyeler modal
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersTitle, setMembersTitle] = useState('');

  // Admin atama modal
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminClub, setAdminClub] = useState(null);
  const [adminUserId, setAdminUserId] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  // admin: kulüp oluştur
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createAdminUserId, setCreateAdminUserId] = useState('');

  const load = async () => {
    const { data } = await api.get('/api/clubs');
    setClubs(data || []);
  };

  const loadMembers = async (club) => {
    setMsg('');
    try {
      const { data } = await api.get(`/api/clubs/${club.id}/members`);
      setMembers(data || []);
      setMembersTitle(`${club.name} — Üyeler`);
      setShowMembers(true);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Üye listesi getirilemedi');
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const join = async (id) => {
    setMsg('');
    try {
      await api.post(`/api/clubs/${id}/join`);
      await load();
      setMsg('Kulübe katıldınız.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Katılım hatası');
    }
  };

  const leave = async (id) => {
    setMsg('');
    try {
      await api.delete(`/api/clubs/${id}/leave`);
      await load();
      setMsg('Kulüpten ayrıldınız.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Ayrılma hatası');
    }
  };

  const createClub = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/api/clubs', {
        name,
        description,
        admin_user_id: createAdminUserId ? Number(createAdminUserId) : null
      });
      setName(''); setDescription(''); setCreateAdminUserId('');
      await load();
      setMsg('Kulüp oluşturuldu.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Oluşturma hatası');
    }
  };

  // clubadmin sadece admini olduğu kulübün üyelerini görebilir
  const canSeeMembers = (club) => {
    if (isStudent) return false;
    if (isAdmin) return true;
    if (isClubAdmin) return club?.admin?.id === user?.id;
    // diğer roller (instructor, student_affairs vs.) görebilir
    return roles.some(r => r !== 'student');
  };

  const filtered = q
    ? clubs.filter(c =>
        (c.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(q.toLowerCase())
      )
    : clubs;

  // ----- Admin atama modal işlevleri -----
  const openAdminModal = (club) => {
    setAdminClub(club);
    setAdminUserId(club?.admin?.id || '');
    setSearchQ('');
    setSearchRes([]);
    setShowAdmin(true);
  };

  const searchUsers = async (e) => {
    e?.preventDefault();
    if (!searchQ.trim()) return setSearchRes([]);
    setSearchBusy(true);
    setMsg('');
    try {
      const { data } = await api.get('/api/users/search', { params: { q: searchQ } });
      setSearchRes(data || []);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Arama yapılamadı');
    } finally {
      setSearchBusy(false);
    }
  };

  const pickUser = (u) => {
    setAdminUserId(u.id);
    setSearchQ(`${u.username} <${u.email}>`);
  };

  const saveAdmin = async (e) => {
    e.preventDefault();
    if (!adminClub) return;
    setMsg('');
    try {
      await api.put(`/api/clubs/${adminClub.id}/admin`, {
        admin_user_id: Number(adminUserId)
      });
      setShowAdmin(false);
      await load();
      setMsg('Kulüp admini güncellendi.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Güncelleme hatası');
    }
  };

  return (
    <div>
      {/* Üstte tek mesaj barı — 3sn sonra otomatik kapanır, ayrıca kullanıcı isterse X ile kapatabilir */}
      {msg && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setMsg('')}
          className="mt-2"
        >
          {msg}
        </Alert>
      )}

      <Row className="g-3">
        <Col md={7}>
          <Card>
            <Card.Body>
              <Card.Title>Kulüpler</Card.Title>

              <InputGroup className="mb-3">
                <InputGroup.Text>Ara</InputGroup.Text>
                <Form.Control
                  placeholder="Kulüp adı / açıklama"
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                />
              </InputGroup>

              <Row className="g-3">
                {filtered.map(club => (
                  <Col md={12} key={club.id}>
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Card.Title className="mb-1">{club.name}</Card.Title>
                            <div className="text-muted mb-2">{club.description || '-'}</div>

                            {/* Admin bilgisi */}
                            <div className="mb-2 d-flex align-items-center gap-2">
                              {club.admin ? (
                                <Badge bg="light" text="dark">
                                  Başkan: {club.admin.username} ({club.admin.email})
                                </Badge>
                              ) : (
                                <Badge bg="secondary">Admin atanmadı</Badge>
                              )}

                              {/* Yalnız site admini görür: Admin ata/değiştir */}
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={()=>openAdminModal(club)}
                                >
                                  Kulüp Başkanı Ata/Değiştir
                                </Button>
                              )}
                            </div>

                            <div className="small text-muted">
                              Üye sayısı: {club.member_count || 0}
                            </div>
                          </div>

                          <div className="d-flex flex-column align-items-end gap-2">
                            {/* Üye listesi */}
                            {canSeeMembers(club) && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={()=>loadMembers(club)}
                              >
                                Üyeleri Gör
                              </Button>
                            )}

                            {/* Katıl / Ayrıl */}
                            {club.is_member ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={()=>leave(club.id)}
                              >
                                Ayrıl
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={()=>join(club.id)}
                              >
                                Katıl
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}

                {!filtered.length && (
                  <Col md={12} className="text-center text-muted">
                    Kayıt yok
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Sağ: Admin kulüp oluştur */}
        <Col md={5}>
          {isAdmin && (
            <Card>
              <Card.Body>
                <Card.Title>Yönetici: Kulüp Oluştur</Card.Title>
                <Form onSubmit={createClub}>
                  <Form.Group className="mb-2">
                    <Form.Label>Ad</Form.Label>
                    <Form.Control value={name} onChange={e=>setName(e.target.value)} required />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Açıklama</Form.Label>
                    <Form.Control value={description} onChange={e=>setDescription(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Kulüp Başkanı (Numara)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="örn. 5"
                      value={createAdminUserId}
                      onChange={e=>setCreateAdminUserId(e.target.value)}
                    />
                    <div className="small text-muted">
                      Boş bırakırsanız admin atanmadan oluşturulur; sonra atanabilir.
                    </div>
                  </Form.Group>
                  <Button type="submit">Oluştur</Button>
                </Form>
              </Card.Body>
            </Card>
          )}
          {!isAdmin && (
            <Card><Card.Body>
              <Card.Title>Bilgi</Card.Title>
              <p className="text-muted mb-0">
                Kulüp oluşturma ve admin atama yalnızca <b>site admini</b> yetkisindedir.
              </p>
            </Card.Body></Card>
          )}
        </Col>
      </Row>

      {/* Üyeler Modal */}
      <Modal show={showMembers} onHide={()=>setShowMembers(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{membersTitle || 'Üyeler'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table hover responsive size="sm">
            <thead>
              <tr><th>#</th><th>Ad</th><th>E-posta</th><th>Katılım</th></tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id ?? i}>
                  <td>{i+1}</td>
                  <td>{m.username}</td>
                  <td className="text-muted">{m.email}</td>
                  <td className="text-muted">{toLocal(m.joined_at)}</td>
                </tr>
              ))}
              {!members.length && (
                <tr><td colSpan={4} className="text-center text-muted">Üye yok</td></tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      {/* Admin Ata/Değiştir Modal (yalnız site admini) */}
      <Modal show={showAdmin} onHide={()=>setShowAdmin(false)} centered>
        <Form onSubmit={saveAdmin}>
          <Modal.Header closeButton>
            <Modal.Title>
              {adminClub ? `${adminClub.name} — Admin Ata/Değiştir` : 'Admin Ata'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Kullanıcı Ara (ad / e-posta)</Form.Label>
              <InputGroup>
                <Form.Control
                  placeholder="örn. emin / emin@okul.edu.tr"
                  value={searchQ}
                  onChange={(e)=>setSearchQ(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key==='Enter') { e.preventDefault(); searchUsers(); } }}
                />
                <Button variant="outline-secondary" onClick={searchUsers} disabled={searchBusy}>
                  Ara
                </Button>
              </InputGroup>
              {!!searchRes.length && (
                <ListGroup className="mt-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {searchRes.map(u => (
                    <ListGroup.Item
                      action
                      key={u.id}
                      onClick={()=>pickUser(u)}
                    >
                      #{u.id} — {u.username} <span className="text-muted">&lt;{u.email}&gt;</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              {!searchRes.length && searchQ && !searchBusy && (
                <div className="small text-muted mt-1">Sonuç bulunamadı.</div>
              )}
            </div>

            <Form.Group className="mb-2">
              <Form.Label>Seçilen Admin (User ID)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={adminUserId}
                onChange={(e)=>setAdminUserId(e.target.value)}
                required
              />
              <div className="small text-muted">
                İstersen doğrudan User ID yazarak atayabilirsin.
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={()=>setShowAdmin(false)}>Kapat</Button>
            <Button type="submit">Kaydet</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
} 