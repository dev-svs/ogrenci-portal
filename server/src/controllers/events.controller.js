// server/src/controllers/events.controller.js
const pool = require('../config/db');

// JS Date -> "YYYY-MM-DD HH:mm:ss" (UTC)
function toMySqlDateTime(d) {
  const pad = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/* -------------------- List -------------------- */
// GET /api/events?scope=upcoming|past&from=YYYY-MM-DD&to=YYYY-MM-DD&q=...
// Cevap alanları: participant_count, is_attended(me), avg_stars, my_stars
exports.list = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const now = new Date();
    const { scope = 'upcoming', from, to, q } = req.query;

    const params = [uid, uid]; // EXISTS için 2 kez (is_attended, my_stars)
    let where = '1=1';
    if (scope === 'upcoming') where += ' AND e.start_utc >= ?';
    if (scope === 'past')     where += ' AND e.start_utc < ?';
    params.push(now);

    if (from) { where += ' AND e.start_utc >= ?'; params.push(new Date(from)); }
    if (to)   { where += ' AND e.start_utc <= ?'; params.push(new Date(to)); }
    if (q)    { where += ' AND (e.title LIKE ? OR e.description LIKE ? OR c.name LIKE ?)';
                params.push(`%${q}%`,`%${q}%`,`%${q}%`); }

    const [rows] = await pool.query(
      ` SELECT e.id, e.title, e.start_utc, e.location, e.description,
        e.club_id, c.name AS club_name,
        (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id=e.id) AS participant_count,
        EXISTS(SELECT 1 FROM event_attendees ea2 WHERE ea2.event_id=e.id AND ea2.user_id=?) AS is_attended,
        (SELECT ROUND(AVG(er.stars),2) FROM event_ratings er WHERE er.event_id=e.id) AS avg_stars,
        (SELECT er2.stars FROM event_ratings er2 WHERE er2.event_id=e.id AND er2.user_id=?) AS my_stars,
        (SELECT COUNT(*) FROM event_ratings er3 WHERE er3.event_id=e.id) AS rating_count
       FROM events e
       LEFT JOIN clubs c ON c.id=e.club_id
       WHERE ${where}
       ORDER BY e.start_utc ${scope === 'past' ? 'DESC' : 'ASC'}`, params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

/* -------------------- Create / Remove -------------------- */
// POST /api/events  { title, start_local, location, description, club_id }
exports.create = async (req, res, next) => {
  try {
    const { title, start_local, location, description, club_id } = req.body;
    if (!title || !start_local) return res.status(400).json({ message: 'title ve start_local gerekli' });
    const s = new Date(start_local);
    if (isNaN(s)) return res.status(400).json({ message: 'Geçersiz tarih' });

    const sUtc = toMySqlDateTime(s);
    const [r] = await pool.query(
      `INSERT INTO events (title, start_utc, location, description, club_id)
       VALUES (?,?,?,?,?)`,
      [title, sUtc, location || null, description || null, club_id || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

// DELETE /api/events/:id
exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM events WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* -------------------- RSVP -------------------- */
// POST /api/events/:id/rsvp
exports.rsvp = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const eventId = Number(req.params.id);

    // geçmiş etkinliğe RSVP yasak
    const [[ev]] = await pool.query(`SELECT start_utc FROM events WHERE id=?`, [eventId]);
    if (!ev) return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    if (new Date(ev.start_utc) < new Date())
      return res.status(400).json({ message: 'Geçmiş etkinliğe katılım yapılamaz' });

    await pool.query(
      `INSERT IGNORE INTO event_attendees (event_id, user_id) VALUES (?,?)`,
      [eventId, uid]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// DELETE /api/events/:id/rsvp
exports.unrsvp = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const eventId = Number(req.params.id);
    await pool.query(
      `DELETE FROM event_attendees WHERE event_id=? AND user_id=?`,
      [eventId, uid]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* -------------------- Attendees + CSV -------------------- */
// GET /api/events/:id/attendees
exports.attendees = async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, ea.joined_at
       FROM event_attendees ea
       JOIN users u ON u.id = ea.user_id
       WHERE ea.event_id=?
       ORDER BY u.username`, [eventId]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /api/events/:id/attendees.csv (öğrenci hariç herkes indirebilir)
exports.attendeesCsv = async (req, res, next) => {
  try {
    const uid = req.user.id;
    // kullanıcının rolleri
    const [roles] = await pool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id=r.id
       WHERE ur.user_id=?`, [uid]
    );
    const names = roles.map(r => r.name);
    if (names.length === 0 || (names.length === 1 && names[0] === 'student') || names.includes('student') && names.every(n => n === 'student')) {
      return res.status(403).json({ message: 'CSV yalnızca öğrenci dışındaki roller için' });
    }

    const eventId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, ea.joined_at
       FROM event_attendees ea
       JOIN users u ON u.id = ea.user_id
       WHERE ea.event_id=?
       ORDER BY u.username`, [eventId]
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event_${eventId}_attendees.csv"`);
    res.write('id,username,email,joined_at\n');
    const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
    for (const r of rows) {
      res.write([esc(r.id), esc(r.username), esc(r.email), esc(r.joined_at)].join(',') + '\n');
    }
    res.end();
  } catch (e) { next(e); }
};

/* -------------------- Rating -------------------- */
// POST /api/events/:id/rate  { stars:1..5 }  (yalnızca katılan + etkinlik geçtikten sonra)
exports.rate = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const eventId = Number(req.params.id);
    const { stars } = req.body;
    const s = Number(stars);
    if (!Number.isInteger(s) || s < 1 || s > 5)
      return res.status(400).json({ message: 'stars 1–5 olmalı' });

    // katılmış mı + etkinlik geçmiş mi?
    const [[ev]] = await pool.query(`SELECT start_utc FROM events WHERE id=?`, [eventId]);
    if (!ev) return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    if (new Date(ev.start_utc) >= new Date())
      return res.status(400).json({ message: 'Sadece geçmiş etkinlik oylanabilir' });

    const [[att]] = await pool.query(
      `SELECT 1 FROM event_attendees WHERE event_id=? AND user_id=?`, [eventId, uid]
    );
    if (!att) return res.status(403).json({ message: 'Sadece katılanlar oy verebilir' });

    // upsert
    await pool.query(
      `INSERT INTO event_ratings (event_id, user_id, stars)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE stars=VALUES(stars), rated_at=CURRENT_TIMESTAMP`,
      [eventId, uid, s]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// GET /api/events/:id/rating  → { avg_stars, count, my_stars }
exports.ratingInfo = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const eventId = Number(req.params.id);
    const [[agg]] = await pool.query(
      `SELECT ROUND(AVG(stars),2) AS avg_stars, COUNT(*) AS count
       FROM event_ratings WHERE event_id=?`, [eventId]
    );
    const [[mine]] = await pool.query(
      `SELECT stars FROM event_ratings WHERE event_id=? AND user_id=?`, [eventId, uid]
    );
    res.json({ avg_stars: agg?.avg_stars || 0, count: agg?.count || 0, my_stars: mine?.stars || null });
  } catch (e) { next(e); }
};
  