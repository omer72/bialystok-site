import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyAdmin } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'images', 'posts'));
  },
  filename: (_req, _file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '.png');
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// PDF and media file storage
const fileStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const postSlug = req.query.postSlug as string;
    if (!postSlug) {
      return cb(new Error('Post slug is required'));
    }
    const dir = path.join(process.cwd(), 'public', 'files', 'migrated', postSlug);
    // Create directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Keep original filename for PDFs and media
    cb(null, file.originalname);
  },
});

const fileUpload = multer({
  storage: fileStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for PDFs
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/wav',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, video, and audio files are allowed'));
    }
  },
});

router.post('/upload', verifyAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const relativePath = `/images/posts/${req.file.filename}`;
  // In production, return full URL so images work from any frontend host
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const filePath = process.env.NODE_ENV === 'production'
    ? `${baseUrl}${relativePath}`
    : relativePath;
  res.json({ path: filePath });
});

router.post('/upload-pdf', verifyAdmin, fileUpload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const postSlug = req.query.postSlug as string;
  if (!postSlug) {
    return res.status(400).json({ error: 'Post slug is required' });
  }
  const relativePath = `/files/migrated/${postSlug}/${req.file.originalname}`;
  // In production, return full URL so files work from any frontend host
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const filePath = process.env.NODE_ENV === 'production'
    ? `${baseUrl}${relativePath}`
    : relativePath;
  res.json({ path: filePath });
});

export { router as uploadRouter };
