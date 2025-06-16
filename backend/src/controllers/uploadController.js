import multer from 'multer';
import Upload from '../models/Upload.js';
import { csvQueue } from '../lib/queue.js';

const upload = multer({ dest: 'uploads/' });

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

    const { format } = req.body;
    const allowed = ['jsonld', 'ngsiv2', 'both', undefined];
    if (!allowed.includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Use jsonld, ngsiv2 or both.' });
    }

    try {
      const uploadDoc = await Upload.create({
        filename: req.file.originalname,
        userId: req.userId,
        format
      });

      await csvQueue.add('csv', {
        path: req.file.path,
        uploadId: uploadDoc._id,
        format 
      }, {
        attempts: 3,                  
        backoff: { type: 'exponential', delay: 5000 }
      });

      res.status(202).json({ uploadId: uploadDoc._id });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Server error during upload' });
    }
  }
];

export const getUploadStatus = async (req, res) => {
  try {
    const upload = await Upload.findById(
      req.params.id,
      { status: 1, jsonld: 1, ngsiv2: 1, error: 1 }
    ).lean();

    if (!upload) {
      return res.sendStatus(404);
    }

    const count = Array.isArray(upload.jsonld)
      ? upload.jsonld.length
      : Array.isArray(upload.ngsiv2)
      ? upload.ngsiv2.length
      : 0;

    return res.json({
      status: upload.status,
      count,
      error: upload.error
    });
  } catch (err) {
    console.error('Status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

