import mongoose from 'mongoose';
import { dataConn } from '../connections/dataConnection.js';

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAIL'],
      default: 'PENDING',
    },

    jsonld:  { type: mongoose.Schema.Types.Mixed },
    ngsiv2:  { type: mongoose.Schema.Types.Mixed },
    error:   { type: String },
  },
  { timestamps: true }
);

export default dataConn.model('Upload', uploadSchema);
