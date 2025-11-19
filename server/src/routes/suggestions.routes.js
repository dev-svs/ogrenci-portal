// server/src/routes/suggestions.routes.js
const router = require('express').Router();
const multer = require('multer');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/suggestions.controller');

// ---- Multer ayarı (uploads klasörü proje kökünde olsun) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '_' + safeName);
  },
});

const upload = multer({ storage });

// ---- Rotalar ----

// Öğrenci / kullanıcı öneri gönderir
router.post('/', requireAuth, upload.single('file'), c.create);

// Önerileri listeleme (istersen sadece admin görsün diye requireRole('admin') ekleyebilirsin)
router.get('/', requireAuth /*, requireRole('admin') */, c.list);

module.exports = router;
