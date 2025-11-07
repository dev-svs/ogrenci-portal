// client/src/pages/NotFound.jsx
export default function NotFound() {
  return (
    <div style={{padding: 40, textAlign: 'center'}}>
      <h2>404</h2>
      <p className="text-muted">Aradığın sayfa bulunamadı.</p>
      <a href="/dashboard" className="btn btn-primary">Dashboard'a dön</a>
    </div>
  );
}
