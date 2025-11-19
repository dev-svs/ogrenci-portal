// client/src/pages/Academic.jsx
import { Card } from 'react-bootstrap';

export default function Academic() {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Akademik Bilgiler</Card.Title>
        <div className="text-muted">
          Öğrencinin dersleri, kayıtlı olduğu dönemler, danışmanı ve benzeri akademik ögeler burada listelenecek.
        </div>
      </Card.Body>
    </Card>
  );
}
