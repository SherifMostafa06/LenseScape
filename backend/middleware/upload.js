// middleware/upload.js — Multer config for studio image uploads
const multer = require('multer');
const path   = require('path');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) =>
    cb(null, `studio-${Date.now()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new AppError('Only image files are allowed.', 400), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
