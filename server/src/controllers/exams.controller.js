const pool = require('../config/db');

// JS Date -> "YYYY-MM-DD HH:mm:ss"
function toMySqlDateTime(d) {
  const pad = (n) => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${
          pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// GET /api/exams?mine=true&from=2025-10-01&to=2025-12-31&q=mat
exports.list = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { mine, from, to, q } = req.query;

    const params = [];
    let where = '1=1';

    if (mine === 'true') {
      where += ` AND e.course_id IN (SELECT course_id FROM enrollments WHERE user_id=?)`;
      params.push(uid);
    }
    if (from) { where += ` AND e.start_utc >= ?`; params.push(new Date(from)); }
    if (to)   { where += ` AND e.start_utc <= ?`; params.push(new Date(to)); }
    if (q)    { where += ` AND (c.code LIKE ? OR c.name LIKE ? OR e.title LIKE ?)`; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }

    const [rows] = await pool.query(
      `SELECT e.id, e.title, e.start_utc, e.end_utc, e.location, e.notes,
              c.id AS course_id, c.code, c.name
       FROM exams e
       JOIN courses c ON c.id=e.course_id
       WHERE ${where}
       ORDER BY e.start_utc ASC`, params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// POST /api/exams  (admin/instructor/student_affairs)
exports.create = async (req, res, next) => {
  try {
    const { course_id, title, start_local, end_local, location, notes } = req.body;
    if (!course_id || !title || !start_local || !end_local)
      return res.status(400).json({ message: 'course_id, title, start_local, end_local gerekli' });

    // start_local/end_local: "YYYY-MM-DDTHH:mm" (local) -> UTC string
    const s = new Date(start_local);
    const e = new Date(end_local);
    if (isNaN(s) || isNaN(e)) return res.status(400).json({ message: 'Geçersiz tarih' });
    if (e <= s) return res.status(400).json({ message: 'Bitiş başlangıçtan sonra olmalı' });

    const sUtc = toMySqlDateTime(s);
    const eUtc = toMySqlDateTime(e);

    const [r] = await pool.query(
      `INSERT INTO exams (course_id, title, start_utc, end_utc, location, notes)
       VALUES (?,?,?,?,?,?)`,
      [course_id, title, sUtc, eUtc, location || null, notes || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

// DELETE /api/exams/:id  (admin/instructor/student_affairs)
exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM exams WHERE id=?`, [id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
