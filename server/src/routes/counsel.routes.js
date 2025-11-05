const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/counsel.controller');

// Listeler
router.get('/counselors', requireAuth, c.listCounselors);
router.get('/threads', requireAuth, c.listMyThreads);
router.get('/message/:id', requireAuth, c.getMessage);

// Öğrenci -> danışman
router.post('/send', requireAuth, c.sendMessage);

// Danışman -> öğrenci (role check)
router.post('/reply', requireAuth, requireRole('counselor'), c.replyMessage);

module.exports = router;
