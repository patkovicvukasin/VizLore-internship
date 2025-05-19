import express from 'express';
import { uploadCsv, getUploadStatus } from '../controllers/uploadController.js'
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// POST /api/upload   (заштићено JWT-ом)
router.post('/', requireAuth, uploadCsv);

// GET /api/upload/:id 
router.get('/:id', requireAuth, getUploadStatus);

export default router;
