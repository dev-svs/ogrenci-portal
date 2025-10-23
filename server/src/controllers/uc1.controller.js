const fs = require('fs');
const pool = require('../config/db');

function csvToLines(path) {
  const txt = fs.readFileSync(path, 'utf8');
  return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

// ITEMS
exports.listItems = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM uc1_items ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { next(e); }
};

exports.createItem = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'title gerekli' });
    const [r] = await pool.query('INSERT INTO uc1_items (title, description) VALUES (?,?)', [title, description || null]);
    res.status(201).json({ id: r.insertId, title, description });
  } catch (e) { next(e); }
};

// VOTES
exports.vote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'itemId gerekli' });

    await pool.query('INSERT IGNORE INTO uc1_votes (user_id, item_id) VALUES (?,?)', [userId, itemId]);

    const [sum] = await pool.query(
      'SELECT i.id, i.title, COUNT(v.user_id) AS votes FROM uc1_items i LEFT JOIN uc1_votes v ON v.item_id=i.id GROUP BY i.id ORDER BY i.id'
    );
    res.json({ ok: true, summary: sum });
  } catch (e) { next(e); }
};

exports.voteSummary = async (_req, res, next) => {
  try {
    const [sum] = await pool.query(
      'SELECT i.id, i.title, COUNT(v.user_id) AS votes FROM uc1_items i LEFT JOIN uc1_votes v ON v.item_id=i.id GROUP BY i.id ORDER BY i.id'
    );
    res.json(sum);
  } catch (e) { next(e); }
};

// NAMES
exports.listNames = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, full_name, created_at FROM uc1_names ORDER BY id DESC');
    res.json(rows);
  } catch (e) { next(e); }
};

exports.uploadNamesCsv = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV dosyası gerekli' });
    const lines = csvToLines(req.file.path);
    if (!lines.length) return res.status(400).json({ message: 'Boş CSV' });

    // toplu insert
    const values = lines.map(n => [n]);
    await pool.query('INSERT INTO uc1_names (full_name) VALUES ?', [values]);

    res.json({ ok: true, inserted: values.length });
  } catch (e) { next(e); }
};

exports.exportNamesCsv = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT full_name FROM uc1_names ORDER BY id ASC');
    const csv = rows.map(r => r.full_name).join('\n') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="uc1_names.csv"');
    res.send(csv);
  } catch (e) { next(e); }
};
