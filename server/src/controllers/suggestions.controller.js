// server/src/controllers/suggestions.controller.js
const db = require('../config/db'); // sende diğer controllerlar ne kullanıyorsa aynısı

async function create(req, res) {
  try {
    const userId = req.user?.id || null; // auth yoksa undefined olur, sorun değil

    const {
      category,
      title,
      description,
      email,
      is_anonymous,
    } = req.body;

    const filePath = req.file ? req.file.path : null;

    const anon =
      is_anonymous === '1' ||
      is_anonymous === 1 ||
      is_anonymous === true ||
      is_anonymous === 'true';

    const userIdToStore = anon ? null : userId;
    const emailToStore  = anon ? null : (email || null);

    await db.query(
      `INSERT INTO suggestions (user_id, category, title, description, file_path, email, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userIdToStore,
        category,
        title,
        description,
        filePath,
        emailToStore,
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
    const [rows] = await db.query(
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

module.exports = { create, list };
