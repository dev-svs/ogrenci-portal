const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/exams.controller');

router.get('/', requireAuth, c.list);
router.post('/', requireAuth, requireRole('admin','instructor','student_affairs'), c.create);
router.delete('/:id', requireAuth, requireRole('admin','instructor','student_affairs'), c.remove);

module.exports = router;
