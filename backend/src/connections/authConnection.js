import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

export const authConn = mongoose.createConnection(
  process.env.MONGO_URI_AUTH,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);