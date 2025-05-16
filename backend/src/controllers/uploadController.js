import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// POST /api/upload controller
export const uploadCsv = [
  upload.single('file'),
  async (req, res) => {
    console.log('*** Upload route hit! ***', req.method, req.path);
    console.log('req.file =', req.file);
    console.log('req.headers =', req.headers);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const filePath = path.resolve(req.file.path);

      // TODO: call conversion scripts here and handle results
      res.json({ message: 'File processed', filename: req.file.filename });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Server error during upload' });
    } finally {
      // Optionally delete temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
];
