// server/src/controllers/users.controller.js
const pool = require('../config/db');

// GET /api/users/search?q=emin
// Sadece admin; dönen alanlar: id, username, email
exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE username LIKE ? OR email LIKE ?
       ORDER BY username
       LIMIT 20`,
      [like, like]
    );
    res.json(rows);
  } catch (e) { next(e); }
};
