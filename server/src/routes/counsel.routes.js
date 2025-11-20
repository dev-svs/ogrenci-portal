// server/src/routes/counsel.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/counsel.controller');

// Danışman listesi
router.get('/counselors', requireAuth, c.listCounselors);

// Ortak thread listesi (öğrenci + danışman)
router.get('/threads', requireAuth, c.listMyThreads);

// Danışmana gelen öğrenci mesaj sayısı (badge için)
router.get('/unread-count', requireAuth, c.unreadCountForCounselor);

// Tek mesaj detayı
router.get('/message/:id', requireAuth, c.getMessage);

// Öğrenci -> danışman
router.post('/send', requireAuth, c.sendMessage);

// Danışman -> öğrenci (role check)
router.post('/reply', requireAuth, requireRole('counselor'), c.replyMessage);

module.exports = router;
