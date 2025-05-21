import fs from 'fs';
import csvParser from 'csv-parser';
import { Worker } from 'bullmq';
import Upload from '../models/Upload.js';
import { toJsonLd, toNgsiV2 } from '../utils/convertCSV.js';
import { upsertEntities } from '../utils/orionClient.js';
import { redisConnection } from '../lib/queue.js';

new Worker(
  'csv',
  async (job) => {
    const { path: filePath, uploadId, format } = job.data;
    try {
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', row => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      let jsonld, ngsiv2;

      if (format === 'jsonld' || format === 'both' || !format) {
        jsonld = toJsonLd(rows);
      }

      if (format === 'ngsiv2' || format === 'both' || !format) {
        ngsiv2 = toNgsiV2(rows);
        console.log(`⬆️ Sending ${ngsiv2.length} entities to Orion...`);
        await upsertEntities(ngsiv2);
        console.log(`✅ Successfully sent entities to Orion`);
      }

      await Upload.findByIdAndUpdate(uploadId, {
        status: 'SUCCESS',
        ...(jsonld && { jsonld }),
        ...(ngsiv2 && { ngsiv2 })
      });
    } catch (err) {
      await Upload.findByIdAndUpdate(uploadId, {
        status: 'FAIL',
        error: err.message
      });
    } finally {
      fs.rmSync(filePath, { force: true });
    }
  },
  { connection: redisConnection }
)
  .on('ready', () => console.log('BullMQ ▶ worker ready'))
  .on('completed', job => console.log('BullMQ ▶ job done', job.id))
  .on('failed', (job, err) => console.log('BullMQ ▶ job failed', job?.id, err.message));
