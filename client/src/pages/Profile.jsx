// client/src/pages/Profile.jsx
import { Card } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <Card>
      <Card.Body>
        <Card.Title>Profil Bilgileri</Card.Title>
        <div className="text-muted">Bu sayfa kullanıcının temel profil bilgilerini göstermek için ayrıldı.</div>
        <hr />
        <div><b>Kullanıcı:</b> {user?.username || user?.email}</div>
        <div><b>E-posta:</b> {user?.email || '-'}</div>
        <div><b>Roller:</b> {(user?.roles || []).join(', ') || '-'}</div>
      </Card.Body>
    </Card>
  );
}
