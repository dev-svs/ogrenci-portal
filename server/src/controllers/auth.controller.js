const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function register(req, res, next) {
  try {
    const { username, email, password, roles = ['student'] } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Eksik alan' });

    const [u1] = await pool.query('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
    if (u1.length) return res.status(409).json({ message: 'Kullanıcı adı veya e-posta kayıtlı' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query('INSERT INTO users (username, email, password) VALUES (?,?,?)', [username, email, hash]);
    const userId = r.insertId;

    // roller ata
    if (roles?.length) {
      const [all] = await pool.query('SELECT id, name FROM roles WHERE name IN (?)', [roles]);
      for (const role of all) {
        await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?,?)', [userId, role.id]);
      }
    }
    res.status(201).json({ id: userId, username, email, roles });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) return res.status(400).json({ message: 'Eksik alan' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email=? OR username=? LIMIT 1', [emailOrUsername, emailOrUsername]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Geçersiz kimlik' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Geçersiz kimlik' });

    // rollerini çek
    const [r2] = await pool.query(
      'SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=?',
      [user.id]
    );
    const roles = r2.map(x => x.name);

    const token = jwt.sign({ id: user.id, username: user.username, roles }, process.env.TOKEN_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, roles } });
  } catch (e) { next(e); }
}

module.exports = { register, login };
