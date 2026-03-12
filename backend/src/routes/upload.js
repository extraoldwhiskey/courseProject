const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/image', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const b64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'inventra',
      transformation: [{ width: 800, height: 600, crop: 'limit' }],
    });
    res.json({ url: result.secure_url });
  } catch (e) { next(e); }
});

module.exports = router;
