import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import './jobs/csvWorker.js';
import Redis from 'ioredis';

import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import { authConn } from './connections/authConnection.js';
import { dataConn } from './connections/dataConnection.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', async (_req, res) => {
  try {
    // ping MongoDB
    await Promise.all([
      authConn.db.command({ ping: 1 }),
      dataConn.db.command({ ping: 1 })
    ]);

    // ping Redis
    const redis = new Redis({ host: 'redis', port: 6379 });
    await redis.ping();
    redis.disconnect();

    // ping Orion Context Broker
    const orionRes = await fetch(`${process.env.ORION_URL}/version`);
    if (!orionRes.ok) throw new Error('Orion unavailable');

    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

Promise.all([
  authConn.asPromise(),
  dataConn.asPromise(),
])
  .then(() => {
    console.log('Connected to auth and data databases');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
