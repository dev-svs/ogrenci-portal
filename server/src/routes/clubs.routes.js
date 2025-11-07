// server/src/routes/clubs.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/clubs.controller');

// Liste
router.get('/', requireAuth, c.list);

// Oluşturma ve admin atama: sadece site admini
router.post('/', requireAuth, requireRole('admin'), c.create);
router.put('/:id/admin', requireAuth, requireRole('admin'), c.setAdmin);

// Üye listesi (visibility rules controller’da uygulanır)
router.get('/:id/members', requireAuth, c.members);

// Üyelik işlemleri (her kullanıcı)
router.post('/:id/join', requireAuth, c.join);
router.delete('/:id/leave', requireAuth, c.leave);

module.exports = router;
