const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token gerekli' });

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Token geçersiz' });
    req.user = payload; // { id, username, roles }
    next();
  });
}

function requireRole(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (roles.some(r => allowed.includes(r))) return next();
    return res.status(403).json({ message: 'Yetki yok' });
  };
}

module.exports = { requireAuth, requireRole };
