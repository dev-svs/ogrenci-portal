const pool = require('../config/db');

// Liste + üyelik durumu (me ile)
exports.listClubs = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [rows] = await pool.query(
      `SELECT c.*,
              EXISTS(SELECT 1 FROM club_members cm WHERE cm.club_id=c.id AND cm.user_id=?) AS is_member
       FROM clubs c ORDER BY c.name ASC`, [uid]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// Kulüp oluştur (admin veya clubadmin)
exports.createClub = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name gerekli' });
    const [r] = await pool.query('INSERT INTO clubs (name, description) VALUES (?,?)', [name, description || null]);
    res.status(201).json({ id: r.insertId, name, description });
  } catch (e) { 
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Kulüp adı mevcut' });
    next(e); 
  }
};

// Kulüp üyeleri (yönetici veya admin görebilir; basit: üye olan da görebilir)
exports.listMembers = async (req, res, next) => {
  try {
    const clubId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, cm.role, cm.joined_at
       FROM club_members cm 
       JOIN users u ON u.id=cm.user_id
       WHERE cm.club_id=? ORDER BY u.username`, [clubId]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// Katıl
exports.joinClub = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ message: 'clubId gerekli' });
    await pool.query('INSERT IGNORE INTO club_members (club_id, user_id) VALUES (?,?)', [clubId, uid]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// Ayrıl
exports.leaveClub = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ message: 'clubId gerekli' });
    await pool.query('DELETE FROM club_members WHERE club_id=? AND user_id=?', [clubId, uid]);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
