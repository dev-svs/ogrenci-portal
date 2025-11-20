// server/src/routes/suggestions.routes.js
const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/suggestions.controller');

// uploads klasörü
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '_' + safeName);
  },
});

const upload = multer({ storage });

// 🔹 Öneri gönderme: HERKES gönderebilsin (auth YOK)
router.post('/', upload.single('file'), c.create);

// 🔹 Önerileri listeleme: sadece admin
router.get('/', requireAuth, requireRole('admin'), c.list);

module.exports = router;
