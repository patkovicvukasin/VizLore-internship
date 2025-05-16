import express from 'express';
import { uploadCsv } from '../controllers/uploadController.js';

const router = express.Router();

// POST /api/upload
router.post('/', uploadCsv);

export default router;
