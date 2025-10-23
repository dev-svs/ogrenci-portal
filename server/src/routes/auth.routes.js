const router = require('express').Router();
const { register, login } = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);

// örnek korumalı rota (admin)
router.get('/me', requireAuth, (req, res) => res.json({ me: req.user }));
router.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => res.json({ secret: 'admin panel' }));

module.exports = router;
