import express from 'express';
import { uploadCsv, getUploadStatus } from '../controllers/uploadController.js'
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();
router.post('/', requireAuth, uploadCsv);
router.get('/:id', requireAuth, getUploadStatus);

export default router;
