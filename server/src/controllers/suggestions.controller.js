// server/src/controllers/suggestions.controller.js
const pool = require('../config/db');

async function create(req, res) {
  try {
    const userId = req.user?.id || null;
    const {
      category,
      title,
      description,
      email,
      is_anonymous,
    } = req.body;

    const filePath = req.file ? req.file.path : null;
    const anon = is_anonymous === '1' || is_anonymous === 1 || is_anonymous === true;

    await pool.query(
      `INSERT INTO suggestions (user_id, category, title, description, file_path, email, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        anon ? null : userId,
        category,
        title,
        description,
        filePath,
        anon ? (email || null) : null,
        anon ? 1 : 0,
      ]
    );

    res.json({ message: 'Öneriniz başarıyla gönderildi.' });
  } catch (err) {
    console.error('suggestions.create error:', err);
    res.status(500).json({ message: 'Öneri gönderilemedi.' });
  }
}

async function list(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.username, u.email AS user_email
       FROM suggestions s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('suggestions.list error:', err);
    res.status(500).json({ message: 'Öneriler alınamadı.' });
  }
}

module.exports = {
  create,
  list,
};
