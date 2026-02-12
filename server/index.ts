import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { adminRouter } from './routes/admin.js';
import { uploadRouter } from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// CORS — allow Netlify frontend and localhost in dev
const allowedOrigins = [
  'http://localhost:3000',
  'https://bialystoksite.netlify.app',
];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now; tighten in production
    }
  },
  credentials: true,
}));

app.use(express.json());

// Serve uploaded images
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

// API routes
app.use('/api', adminRouter);
app.use('/api', uploadRouter);

// Contact form handler
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  console.log('Contact form submission:', { name, email, phone, subject, message });
  // In production, send email or save to file
  res.json({ success: true });
});

// In production, serve the built frontend
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
