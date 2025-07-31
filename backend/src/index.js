import app from './app.js';
import Redis from 'ioredis';
import { authConn } from './connections/authConnection.js';
import { dataConn } from './connections/dataConnection.js';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 4000;

app.get('/health', async (_req, res) => {
  try {
    await Promise.all([
      authConn.db.command({ ping: 1 }),
      dataConn.db.command({ ping: 1 })
    ]);

    const redis = new Redis({ host: 'redis', port: 6379 });
    await redis.ping();
    redis.disconnect();

    const orionRes = await fetch(`${process.env.ORION_URL}/version`);
    if (!orionRes.ok) throw new Error('Orion unavailable');

    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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
