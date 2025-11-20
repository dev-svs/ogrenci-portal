// server/src/controllers/users.controller.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

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

// POST /api/users/change-password { oldPassword, newPassword }
// Giriş yapmış kullanıcı kendi şifresini değiştirir
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Eski ve yeni parola zorunludur' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ message: 'Yeni parola en az 4 karakter olmalıdır' });
    }

    // Kullanıcının mevcut parola hash’ini al
    const [[user]] = await pool.query(
      'SELECT password FROM users WHERE id=?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Eski parola yanlış' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password=? WHERE id=?',
      [newHash, userId]
    );

    res.json({ ok: true, message: 'Parola başarıyla güncellendi' });
  } catch (e) {
    next(e);
  }
};
