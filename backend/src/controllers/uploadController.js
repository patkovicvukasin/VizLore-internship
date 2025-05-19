// backend/src/controllers/uploadController.js
import multer from 'multer';
import Upload from '../models/Upload.js';
import { csvQueue } from '../lib/queue.js';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// POST /api/upload controller
export const uploadCsv = [
  upload.single('file'),
  async (req, res) => {
    console.log('*** Upload route hit! ***', req.method, req.path);
    console.log('req.file =', req.file);
    console.log('req.headers =', req.headers);
    console.log('req.body =', req.body);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Pročitaj opcioni format iz form-data: "jsonld" | "ngsiv2" | "both"
    const { format } = req.body;
    const allowed = ['jsonld', 'ngsiv2', 'both', undefined];
    if (!allowed.includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Use jsonld, ngsiv2 or both.' });
    }

    try {
      // 1) Упиши документ у datadb.uploads
      const uploadDoc = await Upload.create({
        filename: req.file.originalname,
        userId: req.userId,
        format // čuvamo opcioni format u dokumentu
      });

      // 2) Додај job у ред са format poljem
      await csvQueue.add('csv', {
        path: req.file.path,
        uploadId: uploadDoc._id,
        format // prosleđuje se worker-u
      //});
      }, {
        attempts: 3,                           // укупно 3 покушаја
        backoff: { type: 'exponential', delay: 5000 } // експоненцијални раст између покушаја
      });

      // 3) Врати 202 Accepted + ID
      res.status(202).json({ uploadId: uploadDoc._id });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Server error during upload' });
    }
  }
];

// GET /api/upload/:id
export const getUploadStatus = async (req, res) => {
  try {
    const upload = await Upload.findById(
      req.params.id,
      { status: 1, error: 1 }
    ).lean();

    if (!upload) return res.sendStatus(404);
    res.json(upload);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
