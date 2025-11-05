const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/events.controller');

router.get('/', requireAuth, c.list);
router.post('/', requireAuth, requireRole('admin','clubadmin'), c.create);
router.delete('/:id', requireAuth, requireRole('admin','clubadmin'), c.remove);

module.exports = router;
