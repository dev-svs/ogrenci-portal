const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const c = require('../controllers/uc1.controller');

// items
router.get('/items', requireAuth, c.listItems);
router.post('/items', requireAuth, requireRole('admin'), c.createItem);

// votes
router.post('/vote', requireAuth, c.vote);
router.get('/votes/summary', requireAuth, c.voteSummary);

// names
router.get('/names', requireAuth, c.listNames);
router.get('/names.csv', requireAuth, requireRole('admin','clubadmin'), c.exportNamesCsv);
router.get('/names/export', requireAuth, c.exportNamesCsv);

module.exports = router;
