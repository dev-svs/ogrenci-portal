// server/src/controllers/appt.controller.js
const pool = require('../config/db');
const { toMySqlDateTime } = require('../utils/datetime');
const { notifyCounselor } = require('../utils/mailer');

/* ----------------------- Yardımcılar ----------------------- */

async function hasOverlapForProvider(providerId, sUtc, eUtc, ignoreId = null) {
  const params = [providerId, eUtc, sUtc];
  let sql = `
    SELECT 1 FROM appointments
    WHERE provider_id=? AND status='booked'
      AND start_utc < ? AND end_utc > ?
  `;
  if (ignoreId) { sql += ` AND id<>?`; params.push(ignoreId); }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

async function hasOverlapForStudent(studentId, sUtc, eUtc, ignoreId = null) {
  const params = [studentId, eUtc, sUtc];
  let sql = `
    SELECT 1 FROM appointments
    WHERE student_id=? AND status='booked'
      AND start_utc < ? AND end_utc > ?
  `;
  if (ignoreId) { sql += ` AND id<>?`; params.push(ignoreId); }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

async function hasAvailOverlap(providerId, sUtc, eUtc, ignoreId = null) {
  const params = [providerId, eUtc, sUtc];
  let sql = `
    SELECT 1 FROM availabilities
    WHERE provider_id=? AND start_utc < ? AND end_utc > ?
  `;
  if (ignoreId) { sql += ` AND id<>?`; params.push(ignoreId); }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

function startOfDayUtc(dateStr) {
  // "YYYY-MM-DD" -> o günün UTC başı
  return new Date(dateStr + 'T00:00:00Z');
}
function endOfDayUtc(dateStr) {
  return new Date(dateStr + 'T23:59:59Z');
}
function addMinutes(d, mins) { return new Date(d.getTime() + mins * 60000); }
function sliceIntoSlots(sUtc, eUtc, minutes = 30) {
  const out = [];
  for (let t = new Date(sUtc); addMinutes(t, minutes) <= eUtc; t = addMinutes(t, minutes)) {
    out.push({ start: new Date(t), end: addMinutes(t, minutes) });
  }
  return out;
}
function overlap(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (aEnd > bStart);
}

/* ----------------------- Endpointler ----------------------- */

// GET /api/appts?scope=active|past|mine&from=YYYY-MM-DD&to=YYYY-MM-DD&provider=ID
exports.list = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { scope = 'active', from, to, provider } = req.query;

    const now = new Date();
    const params = [];
    let where = `1=1`;

    if (scope === 'mine') {
      where += ` AND (a.student_id=? OR a.provider_id=?)`; params.push(uid, uid);
    } else if (scope === 'active') {
      where += ` AND a.status='booked' AND a.end_utc >= ?`; params.push(now);
    } else if (scope === 'past') {
      where += ` AND a.end_utc < ?`; params.push(now);
    }

    if (from) { where += ` AND a.start_utc >= ?`; params.push(new Date(from)); }
    if (to)   { where += ` AND a.end_utc   <= ?`; params.push(new Date(to)); }
    if (provider) { where += ` AND a.provider_id=?`; params.push(Number(provider)); }

    const [rows] = await pool.query(
      `SELECT a.*, sp.username AS provider_name, st.username AS student_name
       FROM appointments a
       JOIN users sp ON sp.id=a.provider_id
       JOIN users st ON st.id=a.student_id
       WHERE ${where}
       ORDER BY a.start_utc ASC`, params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// POST /api/appts/book  { provider_id, start_local, end_local, topic }
exports.book = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { provider_id, start_local, end_local, topic } = req.body;
    if (!provider_id || !start_local || !end_local)
      return res.status(400).json({ message: 'provider_id, start_local, end_local gerekli' });

    const s = new Date(start_local);
    const e = new Date(end_local);
    if (isNaN(s) || isNaN(e) || e <= s)
      return res.status(400).json({ message: 'Geçersiz saat aralığı' });

    // provider rol doğrulama (instructor / student_affairs)
    const [roles] = await pool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id=r.id
       WHERE ur.user_id=?`, [provider_id]
    );
    const roleNames = roles.map(r => r.name);
    if (!roleNames.some(r => r === 'instructor' || r === 'student_affairs'))
      return res.status(400).json({ message: 'Seçilen kişi randevu sağlayıcısı değil' });

    // çakışma kontrolü
    const sUtc = toMySqlDateTime(s);
    const eUtc = toMySqlDateTime(e);
    if (await hasOverlapForProvider(provider_id, sUtc, eUtc))
      return res.status(409).json({ message: 'Sağlayıcının bu saatte randevusu var' });
    if (await hasOverlapForStudent(studentId, sUtc, eUtc))
      return res.status(409).json({ message: 'Bu saatte sizin başka randevunuz var' });

    const [r] = await pool.query(
      `INSERT INTO appointments (provider_id, student_id, start_utc, end_utc, topic)
       VALUES (?,?,?,?,?)`,
      [provider_id, studentId, sUtc, eUtc, topic || null]
    );

    // e-posta bildirimleri (SMTP yoksa no-op)
    const [[prov]] = await pool.query(`SELECT email, username FROM users WHERE id=?`, [provider_id]);
    const [[stud]] = await pool.query(`SELECT email, username FROM users WHERE id=?`, [studentId]);
    const sHuman = s.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const eHuman = e.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    if (prov?.email) {
      await notifyCounselor(
        prov.email,
        `Yeni randevu: ${stud?.username || 'Öğrenci'}`,
        `Merhaba ${prov.username},\n\n${stud?.username || 'Öğrenci'} sizinle ${sHuman} - ${eHuman} arasında randevu aldı.\nKonu: ${topic || '-'}\n\n— Öğrenci Portalı`
      );
    }
    if (stud?.email) {
      await notifyCounselor(
        stud.email,
        `Randevu onayı`,
        `Merhaba ${stud.username},\n\n${prov?.username || 'Sağlayıcı'} ile ${sHuman} - ${eHuman} arasında randevunuz oluşturuldu.\nKonu: ${topic || '-'}\n\n— Öğrenci Portalı`
      );
    }

    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

// POST /api/appts/cancel { id }
exports.cancel = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'id gerekli' });

    const [[row]] = await pool.query(`SELECT * FROM appointments WHERE id=?`, [id]);
    if (!row) return res.status(404).json({ message: 'Randevu bulunamadı' });
    if (row.student_id !== uid && row.provider_id !== uid)
      return res.status(403).json({ message: 'Yetkiniz yok' });
    if (row.status === 'canceled')
      return res.json({ ok: true, message: 'Zaten iptal' });

    await pool.query(
      `UPDATE appointments SET status='canceled', canceled_at=? WHERE id=?`,
      [toMySqlDateTime(new Date()), id]
    );

    // e-posta
    const [[prov]] = await pool.query(`SELECT email, username FROM users WHERE id=?`, [row.provider_id]);
    const [[stud]] = await pool.query(`SELECT email, username FROM users WHERE id=?`, [row.student_id]);
    const canceler = (uid === row.student_id) ? (stud?.username || 'Öğrenci') : (prov?.username || 'Sağlayıcı');
    const sHuman = new Date(row.start_utc).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const eHuman = new Date(row.end_utc).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    if (prov?.email) {
      await notifyCounselor(
        prov.email,
        `Randevu iptali`,
        `Merhaba ${prov.username},\n\n${canceler} ${sHuman} - ${eHuman} randevusunu iptal etti.\n\n— Öğrenci Portalı`
      );
    }
    if (stud?.email) {
      await notifyCounselor(
        stud.email,
        `Randevu iptali`,
        `Merhaba ${stud.username},\n\n${canceler} ${sHuman} - ${eHuman} randevusunu iptal etti.\n\n— Öğrenci Portalı`
      );
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
};

// GET /api/appts/providers  → instructor + student_affairs listesi
exports.providers = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM users u
      JOIN user_roles ur ON ur.user_id=u.id
      JOIN roles r ON r.id=ur.role_id
      WHERE r.name IN ('instructor','student_affairs')
      ORDER BY u.username
    `);
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /api/appts/slots?provider_id=5&day=YYYY-MM-DD&minutes=30&work_start=09:00&work_end=18:00
exports.slots = async (req, res, next) => {
  try {
    const providerId = Number(req.query.provider_id);
    const day = req.query.day; // "YYYY-MM-DD"
    const minutes = Number(req.query.minutes || 30);
    const workStartStr = (req.query.work_start || '09:00'); // yerel (TR) mesai başlangıcı
    const workEndStr   = (req.query.work_end   || '18:00'); // yerel (TR) mesai bitişi
    if (!providerId || !day) return res.status(400).json({ message: 'provider_id ve day gerekli' });

    // Gün sınırları (UTC)
    const dayStart = startOfDayUtc(day);
    const dayEnd   = endOfDayUtc(day);

    // Europe/Istanbul = UTC+3 (Türkiye sabit +3, DST yok)
    const TZ_OFFSET_HOURS = 3;
    const [wsH, wsM] = workStartStr.split(':').map(Number); // örn 09:00
    const [weH, weM] = workEndStr.split(':').map(Number);   // örn 18:00

    // Mesai penceresini UTC'ye çevir (yerel - 3 saat)
    const workStartUtc = new Date(dayStart.getTime() + ((wsH - TZ_OFFSET_HOURS) * 60 + wsM) * 60000);
    const workEndUtc   = new Date(dayStart.getTime() + ((weH - TZ_OFFSET_HOURS) * 60 + weM) * 60000);

    // 1) Bu günde provider’ın uygunluk blokları (gün ile kesişenler)
    const [avails] = await pool.query(
      `SELECT start_utc, end_utc FROM availabilities
       WHERE provider_id=? AND end_utc >= ? AND start_utc <= ?
       ORDER BY start_utc`, [providerId, dayStart, dayEnd]
    );

    // 2) Bu günde provider’ın dolu (booked) randevuları
    const [busy] = await pool.query(
      `SELECT start_utc, end_utc FROM appointments
       WHERE provider_id=? AND status='booked'
         AND end_utc >= ? AND start_utc <= ?
       ORDER BY start_utc`, [providerId, dayStart, dayEnd]
    );

    // 3) Uygunluk bloklarını (gün sınırı + mesai aralığı) içinde 30 dk slotlara böl
    let allSlots = [];
    for (const a of avails) {
      const s = new Date(a.start_utc);
      const e = new Date(a.end_utc);

      // Önce gün sınırına kırp
      let sClamped = s < dayStart ? dayStart : s;
      let eClamped = e > dayEnd   ? dayEnd   : e;

      // Sonra mesai penceresine kırp
      if (eClamped <= workStartUtc || sClamped >= workEndUtc) {
        // Mesai ile hiç kesişmiyorsa bu bloğu atla
        continue;
      }
      if (sClamped < workStartUtc) sClamped = workStartUtc;
      if (eClamped > workEndUtc)   eClamped = workEndUtc;

      allSlots = allSlots.concat(sliceIntoSlots(sClamped, eClamped, minutes));
    }

    // 4) Dolu randevularla çakışan slotları ele
    const free = allSlots.filter(slot =>
      !busy.some(b => overlap(slot.start, slot.end, new Date(b.start_utc), new Date(b.end_utc)))
    );

    // 5) Cevap (ISO UTC)
    res.json(free.map(s => ({
      start_utc: s.start.toISOString(),
      end_utc:   s.end.toISOString()
    })));
  } catch (e) { next(e); }
};

// GET /api/appts/my-avails
exports.myAvails = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { from, to } = req.query;
    const params = [uid];
    let where = `provider_id=?`;
    if (from) { where += ` AND start_utc >= ?`; params.push(new Date(from)); }
    if (to)   { where += ` AND end_utc   <= ?`; params.push(new Date(to)); }
    const [rows] = await pool.query(
      `SELECT id, start_utc, end_utc, note FROM availabilities
       WHERE ${where} ORDER BY start_utc ASC`, params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// POST /api/appts/my-avails  { start_local, end_local, note }
exports.createMyAvail = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { start_local, end_local, note } = req.body;
    const s = new Date(start_local);
    const e = new Date(end_local);
    if (isNaN(s) || isNaN(e) || e <= s)
      return res.status(400).json({ message: 'Geçersiz saat aralığı' });

    const sUtc = toMySqlDateTime(s);
    const eUtc = toMySqlDateTime(e);
    if (await hasAvailOverlap(uid, sUtc, eUtc))
      return res.status(409).json({ message: 'Bu aralık mevcut uygunluklarla çakışıyor' });

    const [r] = await pool.query(
      `INSERT INTO availabilities (provider_id, start_utc, end_utc, note)
       VALUES (?,?,?,?)`, [uid, sUtc, eUtc, note || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

// DELETE /api/appts/my-avails/:id
exports.deleteMyAvail = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const id = Number(req.params.id);
    const [[row]] = await pool.query(`SELECT provider_id FROM availabilities WHERE id=?`, [id]);
    if (!row) return res.status(404).json({ message: 'Bulunamadı' });
    if (row.provider_id !== uid) return res.status(403).json({ message: 'Yetkiniz yok' });

    await pool.query(`DELETE FROM availabilities WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
