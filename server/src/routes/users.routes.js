// server/src/routes/users.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/users.controller');

// Sadece site admini arama yapabilir
router.get('/search', requireAuth, requireRole('admin'), c.search);

module.exports = router;
