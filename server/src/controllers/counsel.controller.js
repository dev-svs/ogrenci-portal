// server/src/controllers/counsel.controller.js
const crypto = require('crypto');
const pool = require('../config/db');
const { notifyCounselor } = require('../utils/mailer');

/* -------------------- Şifreleme Yardımcıları -------------------- */
/*
  Tablo kolonların:
    body_enc  : base64 şifreli metin
    iv        : base64 IV
  auth_tag KULLANMIYORUZ (AES-GCM değil, AES-256-CBC).
*/

const RAW_KEY = process.env.COUNSELOR_MSG_KEY || 'change-this-key-please-32-bytes!';
/* 32 byte olacak şekilde kes / doldur */
const KEY = Buffer.from(RAW_KEY.padEnd(32, '0').slice(0, 32), 'utf8');
const ALGO = 'aes-256-cbc';

function encrypt(plainText) {
  if (!plainText) throw new Error('Boş metin şifrelenemez');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let enc = cipher.update(plainText, 'utf8', 'base64');
  enc += cipher.final('base64');
  return {
    iv: iv.toString('base64'),
    data: enc,
  };
}

function decrypt(ivB64, encB64) {
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  let dec = decipher.update(encB64, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

/* -------------------- Danışman listesi -------------------- */

// GET /api/counsel/counselors
exports.listCounselors = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name = 'counselor'
      ORDER BY u.username
    `);
    res.json(rows);
  } catch (e) { next(e); }
};

/* -------------------- Öğrenci → Danışman mesaj gönder -------------------- */

// POST /api/counsel/send  { counselor_id, subject, body }
exports.sendMessage = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { counselor_id, subject, body } = req.body;

    if (!counselor_id || !subject || !body) {
      return res.status(400).json({ message: 'counselor_id, subject, body gerekli' });
    }

    const { iv, data } = encrypt(body);

    const [r] = await pool.query(`
      INSERT INTO counselor_messages
        (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?,?,?,?,?, 'student')
    `, [studentId, counselor_id, subject, data, iv]);

    // Danışmana mail bildirimi (gizlilik için içerik yok)
    const [[c]] = await pool.query(
      `SELECT email, username FROM users WHERE id=?`,
      [counselor_id]
    );
    if (c?.email) {
      await notifyCounselor(
        c.email,
        `Yeni danışan mesajı: ${subject}`,
        `Merhaba ${c.username},\n\nPortalda yeni bir mesajınız var. Lütfen giriş yapın.\n\n— Öğrenci Portalı`
      );
    }

    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

/* -------------------- Danışman → Öğrenci cevap -------------------- */

// POST /api/counsel/reply  { student_id, subject, body }
exports.replyMessage = async (req, res, next) => {
  try {
    const counselorId = req.user.id;
    const { student_id, subject, body } = req.body;

    if (!student_id || !subject || !body) {
      return res.status(400).json({ message: 'student_id, subject, body gerekli' });
    }

    const { iv, data } = encrypt(body);

    await pool.query(`
      INSERT INTO counselor_messages
        (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?,?,?,?,?, 'counselor')
    `, [student_id, counselorId, subject, data, iv]);

    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* -------------------- Thread listeleri -------------------- */

/*
  Her iki tarafta da (öğrenci & danışman) aynı endpoint:
  GET /api/counsel/threads

  - Öğrenciyse: sadece kendi mesajları
  - Danışmansa: kendisine gelen/gönderdiği tüm mesajlar
*/
exports.listMyThreads = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const roles = req.user.roles || [];

    let where = '';
    let params = [];

    if (roles.includes('counselor')) {
      // Danışman: counselor_id = ben
      where = 'm.counselor_id = ?';
      params = [uid];
    } else {
      // Öğrenci: student_id = ben
      where = 'm.student_id = ?';
      params = [uid];
    }

    const [rows] = await pool.query(`
      SELECT
        m.id,
        m.student_id,
        m.counselor_id,
        m.subject,
        m.created_at,
        m.from_role,
        s.username AS student_name,
        c.username AS counselor_name
      FROM counselor_messages m
      JOIN users s ON s.id = m.student_id
      JOIN users c ON c.id = m.counselor_id
      WHERE ${where}
      ORDER BY m.created_at DESC
      LIMIT 200
    `, params);

    const result = rows.map(r => ({
      id: r.id,
      subject: r.subject,
      from_role: r.from_role,
      created_at: r.created_at,
      student_id: r.student_id,
      student_name: r.student_name,
      counselor_id: r.counselor_id,
      counselor_name: r.counselor_name,
      body: '' // listede içerik yok, detayda decrypt ediyoruz
    }));

    res.json(result);
  } catch (e) { next(e); }
};

/* -------------------- Mesaj detayı -------------------- */

// GET /api/counsel/message/:id
exports.getMessage = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const id = Number(req.params.id);

    const [[row]] = await pool.query(`
      SELECT
        m.*,
        s.username AS student_name,
        c.username AS counselor_name
      FROM counselor_messages m
      JOIN users s ON s.id = m.student_id
      JOIN users c ON c.id = m.counselor_id
      WHERE m.id = ?
    `, [id]);

    if (!row) return res.status(404).json({ message: 'Bulunamadı' });

    // Yetki: sadece ilgili öğrenci veya danışman okuyabilir
    if (row.student_id !== uid && row.counselor_id !== uid) {
      return res.status(403).json({ message: 'Yetki yok' });
    }

    const body = decrypt(row.iv, row.body_enc);

    res.json({
      id: row.id,
      subject: row.subject,
      from_role: row.from_role,
      created_at: row.created_at,
      student_id: row.student_id,
      student_name: row.student_name,
      counselor_id: row.counselor_id,
      counselor_name: row.counselor_name,
      body
    });
  } catch (e) { next(e); }
};