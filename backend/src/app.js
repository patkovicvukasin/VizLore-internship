import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

if (process.env.NODE_ENV !== 'test') {
  const uploadRoutes = (await import('./routes/upload.js')).default;
  app.use('/api/upload', uploadRoutes);
}

export default app;
