// server/src/routes/users.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/users.controller');

// Sadece site admini arama yapabilir
router.get('/search', requireAuth, requireRole('admin'), c.search);

// Giriş yapmış kullanıcı kendi parolasını değiştirebilir
router.post('/change-password', requireAuth, c.changePassword);

module.exports = router;
