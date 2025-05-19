// backend/src/models/User.js
import mongoose from 'mongoose';
import { authConn } from '../connections/authConnection.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Креирамо модел на специфичној auth конекцији
export default authConn.model('User', userSchema);
