// backend/src/lib/queue.js
import { Queue } from 'bullmq';

// Centralizovana konekcija za Redis
export const redisConnection = {
  host: 'redis',
  port: 6379
};

// Definiše BullMQ queue za CSV obrade
export const csvQueue = new Queue('csv', {
  connection: redisConnection
});
