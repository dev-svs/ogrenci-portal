import { useEffect, useState } from "react";
import { Table, Card, Alert } from "react-bootstrap";
import api from "../api/axios";

export default function SuggestionsList() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/suggestions")
      .then((res) => setRows(res.data))
      .catch(() => setMsg("Yüklenemedi."));
  }, []);

  return (
    <Card>
      <Card.Body>
        <Card.Title>Gelen Öneriler</Card.Title>
        {msg && <Alert variant="danger">{msg}</Alert>}

        <Table striped hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Kategori</th>
              <th>Başlık</th>
              <th>Gönderen</th>
              <th>Tarih</th>
              <th>Dosya</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.category}</td>
                <td>{r.title}</td>
                <td>
                  {r.is_anonymous
                    ? "Anonim"
                    : `${r.username} (${r.user_email})`}
                </td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  {r.file_path ? (
                    <a href={`/${r.file_path}`} target="_blank">
                      Dosya
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
