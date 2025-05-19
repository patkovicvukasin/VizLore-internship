// backend/src/jobs/csvWorker.js
import fs from 'fs';
import csvParser from 'csv-parser';
import { Worker } from 'bullmq';
import Upload from '../models/Upload.js';
import { toJsonLd, toNgsiV2 } from '../utils/convertCSV.js';
import { upsertEntities } from '../utils/orionClient.js';
import { redisConnection } from '../lib/queue.js';

// Pokreće se BullMQ worker sa centralnom Redis konekcijom
new Worker(
  'csv',
  async (job) => {
    const { path: filePath, uploadId, format } = job.data;
    try {
      // 1) Čitanje CSV-a:
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', row => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // 2) Konverzija:
      let jsonld, ngsiv2;
      switch (format) {
        case 'jsonld':
          jsonld = toJsonLd(rows);
          break;
        case 'ngsiv2':
          ngsiv2 = toNgsiV2(rows);
          await upsertEntities(ngsiv2);
          break;
        default: // both ili undefined
          jsonld = toJsonLd(rows);
          ngsiv2 = toNgsiV2(rows);
          await upsertEntities(ngsiv2);
      }

      // 3) Ažuriranje Mongo dokumenta:
      await Upload.findByIdAndUpdate(uploadId, {
        status: 'SUCCESS',
        ...(jsonld && { jsonld }),
        ...(ngsiv2 && { ngsiv2 })
      });
    } catch (err) {
      // Greška tokom obrade:
      await Upload.findByIdAndUpdate(uploadId, {
        status: 'FAIL',
        error: err.message
      });
    } finally {
      // 4) Brisanje privremenog fajla:
      fs.rmSync(filePath, { force: true });
    }
  },
  { connection: redisConnection }
)
  .on('ready', () => console.log('BullMQ ▶ worker ready'))
  .on('completed', job => console.log('BullMQ ▶ job done', job.id))
  .on('failed', (job, err) => console.log('BullMQ ▶ job failed', job?.id, err.message));
