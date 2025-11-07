// server/src/routes/events.routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/events.controller');

// Liste (geçmiş/gelecek ayrımı query ile)
router.get('/', requireAuth, c.list);

// Oluştur / Sil (admin & clubadmin)
router.post('/', requireAuth, requireRole('admin','clubadmin'), c.create);
router.delete('/:id', requireAuth, requireRole('admin','clubadmin'), c.remove);

// RSVP & Katılımcılar
router.post('/:id/rsvp',    requireAuth, c.rsvp);
router.delete('/:id/rsvp',  requireAuth, c.unrsvp);
router.get('/:id/attendees',requireAuth, c.attendees);
router.get('/:id/attendees.csv', requireAuth, c.attendeesCsv);

// Rating
router.post('/:id/rate',    requireAuth, c.rate);
router.get('/:id/rating',   requireAuth, c.ratingInfo);

module.exports = router;
