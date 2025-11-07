// server/src/controllers/clubs.controller.js
const pool = require('../config/db');

/* ---------- Helpers ---------- */
async function getRoles(userId) {
  const [rows] = await pool.query(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id=r.id
    WHERE ur.user_id=?`, [userId]
  );
  return rows.map(r => r.name);
}

async function isClubAdminOf(userId, clubId) {
  const [[row]] = await pool.query(
    `SELECT 1 FROM clubs WHERE id=? AND admin_user_id=?`, [clubId, userId]
  );
  return !!row;
}

/* ---------- LIST ---------- */
// GET /api/clubs
// Returns: id, name, description, admin {id,username,email}, member_count, is_member(me)
exports.list = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.description,
             c.admin_user_id,
             (SELECT username FROM users WHERE id=c.admin_user_id) AS admin_username,
             (SELECT email    FROM users WHERE id=c.admin_user_id) AS admin_email,
             (SELECT COUNT(*) FROM club_members m WHERE m.club_id=c.id) AS member_count,
             EXISTS(SELECT 1 FROM club_members m2 WHERE m2.club_id=c.id AND m2.user_id=?) AS is_member
      FROM clubs c
      ORDER BY c.name`, [uid]
    );

    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      admin: r.admin_user_id ? { id: r.admin_user_id, username: r.admin_username, email: r.admin_email } : null,
      member_count: Number(r.member_count || 0),
      is_member: !!r.is_member
    })));
  } catch (e) { next(e); }
};

/* ---------- CREATE ---------- */
// POST /api/clubs  { name, description, admin_user_id }
exports.create = async (req, res, next) => {
  try {
    const { name, description, admin_user_id } = req.body;
    if (!name) return res.status(400).json({ message: 'name gerekli' });

    if (admin_user_id) {
      const [[u]] = await pool.query(`SELECT id FROM users WHERE id=?`, [admin_user_id]);
      if (!u) return res.status(400).json({ message: 'admin_user_id geçersiz' });
    }

    const [r] = await pool.query(
      `INSERT INTO clubs (name, description, admin_user_id) VALUES (?,?,?)`,
      [name, description || null, admin_user_id || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

/* ---------- SET ADMIN ---------- */
// PUT /api/clubs/:id/admin  { admin_user_id }
exports.setAdmin = async (req, res, next) => {
  try {
    const clubId = Number(req.params.id);
    const { admin_user_id } = req.body;
    if (!admin_user_id) return res.status(400).json({ message: 'admin_user_id gerekli' });

    const [[u]] = await pool.query(`SELECT id FROM users WHERE id=?`, [admin_user_id]);
    if (!u) return res.status(400).json({ message: 'admin_user_id geçersiz' });

    await pool.query(`UPDATE clubs SET admin_user_id=? WHERE id=?`, [admin_user_id, clubId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/* ---------- MEMBERS (Visibility Rules) ---------- */
// GET /api/clubs/:id/members
exports.members = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const clubId = Number(req.params.id);
    const roles = await getRoles(uid);

    const isStudent = roles.includes('student');
    const isClubAdmin = roles.includes('clubadmin');

    if (isStudent) {
      return res.status(403).json({ message: 'Öğrenciler üye listesini görüntüleyemez' });
    }
    if (isClubAdmin) {
      const allowed = await isClubAdminOf(uid, clubId);
      if (!allowed) return res.status(403).json({ message: 'Sadece admini olduğunuz kulübün üyelerini görebilirsiniz' });
    }
    // Diğer roller (admin, instructor, student_affairs, ...) serbest

    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, m.joined_at
      FROM club_members m
      JOIN users u ON u.id=m.user_id
      WHERE m.club_id=?
      ORDER BY u.username`, [clubId]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

/* ---------- JOIN / LEAVE ---------- */
// POST /api/clubs/:id/join
exports.join = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const clubId = Number(req.params.id);
    await pool.query(
      `INSERT IGNORE INTO club_members (club_id, user_id) VALUES (?,?)`,
      [clubId, uid]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// DELETE /api/clubs/:id/leave
exports.leave = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const clubId = Number(req.params.id);
    await pool.query(
      `DELETE FROM club_members WHERE club_id=? AND user_id=?`,
      [clubId, uid]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};
