const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/clubs.controller');

router.get('/', requireAuth, c.listClubs);
router.post('/', requireAuth, requireRole('admin','clubadmin'), c.createClub);
router.get('/:id/members', requireAuth, c.listMembers);
router.post('/join', requireAuth, c.joinClub);
router.post('/leave', requireAuth, c.leaveClub);

module.exports = router;
