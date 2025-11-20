// server/src/controllers/counsel.controller.js
const pool = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');
const { notifyCounselor } = require('../utils/mailer');

/* ---------------- Danışman listesi ---------------- */

exports.listCounselors = async (req, res, next) => {
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

/* ---------------- Öğrenci -> Danışman mesaj gönder ---------------- */

exports.sendMessage = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { counselor_id, subject, body } = req.body;

    if (!counselor_id || !subject || !body) {
      return res
        .status(400)
        .json({ message: 'counselor_id, subject, body gerekli' });
    }

    // Gövdeyi şifrele
    const { iv, data } = encrypt(body);

    const [r] = await pool.query(
      `
      INSERT INTO counselor_messages
        (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?,?,?,?,?, 'student')
    `,
      [studentId, counselor_id, subject, data, iv]
    );

    // Danışmana mail bildirimi (içeriği mailde düz vermiyoruz)
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

/* ---------------- Danışman -> Öğrenci cevap ---------------- */

exports.replyMessage = async (req, res, next) => {
  try {
    const counselorId = req.user.id;
    const { student_id, subject, body } = req.body;

    if (!student_id || !subject || !body) {
      return res
        .status(400)
        .json({ message: 'student_id, subject, body gerekli' });
    }

    const { iv, data } = encrypt(body);

    await pool.query(
      `
      INSERT INTO counselor_messages
        (student_id, counselor_id, subject, body_enc, iv, from_role)
      VALUES (?,?,?,?,?, 'counselor')
    `,
      [student_id, counselorId, subject, data, iv]
    );

    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* ---------------- Ortak thread listesi (öğrenci + danışman) ---------------- */
/*  GET /api/counsel/threads
    - Öğrenci ise: içinde student_id = benim olduğum tüm mesajlar
    - Danışman ise: içinde counselor_id = benim olduğu tüm mesajlar
    (WHERE student_id = uid OR counselor_id = uid)                  */

// Konuşma (thread) listesi: hem öğrenci hem danışman için
exports.listMyThreads = async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [rows] = await pool.query(`
      SELECT
        m.id,
        m.student_id,
        m.counselor_id,
        m.subject,
        m.body_enc,
        m.iv,
        m.from_role,
        -- TR saati olarak okunabilir string
        DATE_FORMAT(m.created_at, '%d.%m.%Y %H:%i:%s') AS created_at_tr,
        s.username AS student_name,
        c.username AS counselor_name
      FROM counselor_messages m
      JOIN users s ON s.id = m.student_id
      JOIN users c ON c.id = m.counselor_id
      WHERE m.student_id = ? OR m.counselor_id = ?
      ORDER BY m.created_at DESC
      LIMIT 200
    `, [uid, uid]);

    const result = rows.map(r => ({
      id: r.id,
      subject: r.subject,
      from_role: r.from_role,
      created_at: r.created_at_tr,   // <<< hazır TR string
      student_id: r.student_id,
      student_name: r.student_name,
      counselor_id: r.counselor_id,
      counselor_name: r.counselor_name,
      body: ''                       // listede gövdeyi göstermiyoruz
    }));

    res.json(result);
  } catch (e) { next(e); }
};

/* ---------------- Danışman için gelen öğrenci mesaj sayısı ---------------- */
/* GET /api/counsel/unread-count
   Şimdilik “öğrenciden gelen toplam mesaj sayısı” gibi davranıyor.          */

exports.unreadCountForCounselor = async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM counselor_messages
      WHERE counselor_id = ? AND from_role = 'student'
    `,
      [uid]
    );

    res.json({ count: rows[0]?.cnt || 0 });
  } catch (e) { next(e); }
};

/* ---------------- Tek mesaj detayı ---------------- */

// Detay (tek mesaj)
exports.getMessage = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const id = Number(req.params.id);

    const [[row]] = await pool.query(`
      SELECT
        m.*,
        DATE_FORMAT(m.created_at, '%d.%m.%Y %H:%i:%s') AS created_at_tr,
        s.username AS student_name,
        c.username AS counselor_name
      FROM counselor_messages m
      JOIN users s ON s.id = m.student_id
      JOIN users c ON c.id = m.counselor_id
      WHERE m.id = ?
    `, [id]);

    if (!row) return res.status(404).json({ message: 'Bulunamadı' });

    // Yetki kontrolü
    if (row.student_id !== uid && row.counselor_id !== uid) {
      return res.status(403).json({ message: 'Yetki yok' });
    }

    const body = decrypt(row.iv, row.body_enc);

    res.json({
      id: row.id,
      subject: row.subject,
      from_role: row.from_role,
      created_at: row.created_at_tr,     // <<< yine hazır string
      student_id: row.student_id,
      student_name: row.student_name,
      counselor_id: row.counselor_id,
      counselor_name: row.counselor_name,
      body
    });
  } catch (e) { next(e); }
};
