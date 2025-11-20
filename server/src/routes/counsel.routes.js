// server/src/routes/counsel.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/counsel.controller');

// Listeler (ortak): öğrenci de danışman da kendi erişebildiğini alıyor
router.get('/counselors', requireAuth, c.listCounselors);
router.get('/threads', requireAuth, c.listMyThreads);      // hem öğrenci hem counsel
router.get('/message/:id', requireAuth, c.getMessage);

// Öğrenci -> danışman
router.post('/send', requireAuth, c.sendMessage);

// Danışman -> öğrenci
router.post('/reply', requireAuth, requireRole('counselor'), c.replyMessage);

module.exports = router;
