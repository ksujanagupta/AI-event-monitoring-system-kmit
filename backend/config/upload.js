const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Photos saved to backend/uploads and served at /uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`),
});

module.exports = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
