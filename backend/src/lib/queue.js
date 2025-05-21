import { Queue } from 'bullmq';

export const redisConnection = {
  host: 'redis',
  port: 6379
};

export const csvQueue = new Queue('csv', {
  connection: redisConnection
});
