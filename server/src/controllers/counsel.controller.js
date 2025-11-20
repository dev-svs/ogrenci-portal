const pool = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');
const { notifyCounselor } = require('../utils/mailer');

/* -----------------------------------------------------------
   1) Danışman Listesi
----------------------------------------------------------- */
exports.listCounselors = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name='counselor'
      ORDER BY u.username
    `);
    res.json(rows);
  } catch (e) { next(e); }
};


/* -----------------------------------------------------------
   2) Öğrenci → Danışman Mesaj Gönderme
----------------------------------------------------------- */
exports.sendMessage = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Bazı UI'larda message, bazılarında body geliyor → birleşik alıyoruz
    const {
      counselor_id,
      subject,
      body,
      message
    } = req.body;

    if (!counselor_id)
      return res.status(400).json({ message: 'counselor_id gerekli' });

    const text = (body ?? message ?? '').trim();

    if (!text)
      return res.status(400).json({ message: 'Mesaj metni boş olamaz' });

    const safeSubject = subject?.trim() || '(Konusuz)';

    const { iv, data } = encrypt(text);

    const [r] = await pool.query(
      `
      INSERT INTO counselor_messages
      (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?, ?, ?, ?, ?, 'student')
      `,
      [studentId, counselor_id, safeSubject, data, iv]
    );

    // Bildirim e-postası
    const [[c]] = await pool.query(
      `SELECT email, username FROM users WHERE id=?`,
      [counselor_id]
    );

    if (c?.email) {
      await notifyCounselor(
        c.email,
        `Yeni danışan mesajı`,
        `Merhaba ${c.username},\n\nPortalda yeni bir mesajınız var.\nLütfen giriş yapın.\n\n— Öğrenci Portalı`
      );
    }

    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};


/* -----------------------------------------------------------
   3) Danışman → Öğrenci Yanıt
----------------------------------------------------------- */
exports.replyMessage = async (req, res, next) => {
  try {
    const counselorId = req.user.id;

    const {
      student_id,
      subject,
      body,
      message
    } = req.body;

    if (!student_id)
      return res.status(400).json({ message: 'student_id gerekli' });

    const text = (body ?? message ?? '').trim();

    if (!text)
      return res.status(400).json({ message: 'Mesaj metni boş olamaz' });

    const safeSubject = subject?.trim() || '(Yanıt)';

    const { iv, data } = encrypt(text);

    await pool.query(
      `
      INSERT INTO counselor_messages
      (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?, ?, ?, ?, ?, 'counselor')
      `,
      [student_id, counselorId, safeSubject, data, iv]
    );

    res.json({ ok: true });
  } catch (e) { next(e); }
};


/* -----------------------------------------------------------
   4) Öğrenci için mesaj listesi
----------------------------------------------------------- */
exports.listMyThreads = async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        m.id, m.student_id, m.counselor_id, m.subject, m.created_at,
        m.from_role,
        s.username AS student_name,
        c.username AS counselor_name
      FROM counselor_messages m
      JOIN users s ON s.id = m.student_id
      JOIN users c ON c.id = m.counselor_id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC
      LIMIT 200
    `, [uid]);

    const out = rows.map(r => ({
      id: r.id,
      subject: r.subject,
      from_role: r.from_role,
      created_at: r.created_at,
      counselor_id: r.counselor_id,
      counselor_name: r.counselor_name,
      body: '' // listede içerik yok (gizlilik)
    }));

    res.json(out);
  } catch (e) { next(e); }
};


/* -----------------------------------------------------------
   5) Mesaj Detayı
----------------------------------------------------------- */
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

    if (!row)
      return res.status(404).json({ message: 'Bulunamadı' });

    // Yetki kontrolü
    if (row.student_id !== uid && row.counselor_id !== uid)
      return res.status(403).json({ message: 'Yetki yok' });

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
