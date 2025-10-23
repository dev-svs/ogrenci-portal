const multer = require('multer');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

function fileFilter(_req, file, cb) {
  const ok = ['text/csv', 'application/vnd.ms-excel'].includes(file.mimetype)
           || file.originalname.toLowerCase().endsWith('.csv');
  cb(ok ? null : new Error('Sadece CSV!'), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
