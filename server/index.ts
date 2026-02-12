import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminRouter } from './routes/admin.js';
import { uploadRouter } from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
