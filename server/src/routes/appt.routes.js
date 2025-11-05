// server/src/routes/appt.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/appt.controller');

// Listeleme & işlemler
router.get('/',        requireAuth, c.list);
router.post('/book',   requireAuth, c.book);
router.post('/cancel', requireAuth, c.cancel);

// Sağlayıcı listesi & slotlar
router.get('/providers', requireAuth, c.providers);
router.get('/slots',     requireAuth, c.slots);

// Sağlayıcıların kendi uygunluk yönetimi
router.get('/my-avails',       requireAuth, requireRole('instructor','student_affairs'), c.myAvails);
router.post('/my-avails',      requireAuth, requireRole('instructor','student_affairs'), c.createMyAvail);
router.delete('/my-avails/:id',requireAuth, requireRole('instructor','student_affairs'), c.deleteMyAvail);

module.exports = router;
