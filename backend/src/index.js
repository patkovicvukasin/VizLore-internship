import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and mount routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Mount upload routes
import uploadRoutes from './routes/upload.js';
app.use('/api/upload', uploadRoutes);

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
