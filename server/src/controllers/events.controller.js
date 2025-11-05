const pool = require('../config/db');

// JS Date -> "YYYY-MM-DD HH:mm:ss" (UTC)
function toMySqlDateTime(d) {
  const pad = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD&q=...
exports.list = async (req, res, next) => {
  try {
    const { from, to, q } = req.query;
    const params = [];
    let where = '1=1';
    if (from) { where += ' AND e.start_utc >= ?'; params.push(new Date(from)); }
    if (to)   { where += ' AND e.start_utc <= ?'; params.push(new Date(to)); }
    if (q)    { where += ' AND (e.title LIKE ? OR e.description LIKE ? OR c.name LIKE ?)';
                params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    const [rows] = await pool.query(
      `SELECT e.id, e.title, e.start_utc, e.location, e.description,
              e.club_id, c.name AS club_name
       FROM events e
       LEFT JOIN clubs c ON c.id=e.club_id
       WHERE ${where}
       ORDER BY e.start_utc ASC`, params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

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
