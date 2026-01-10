import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { DexRouter } from './dexRouter';
import { prisma } from '../db';
import { orderEvents } from '../utils/events';
import { logger } from '../utils/logger';

// Create a reusable Redis connection instance
const redisConnection = config.REDIS_URL 
  ? new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({ 
      host: config.REDIS_HOST, 
      port: config.REDIS_PORT, 
      maxRetriesPerRequest: null 
    });

redisConnection.on('error', (err) => logger.error('Redis Connection Error:', err));

export const orderQueue = new Queue('order-execution', { connection: redisConnection });

const router = new DexRouter();

export const processOrder = async (job: Job) => {
// ... (rest of the code stays same)
  } catch (error: any) {
    logger.error(`Order ${orderId} failed: ${error.message}`);
    await updateStatus('FAILED', { errorReason: error.message });
    throw error;
  }
};

// Worker implementation
const worker = new Worker('order-execution', processOrder, { 
  connection: redisConnection,
  concurrency: 10,
  limiter: {
    max: 100,
    duration: 60000
  }
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with ${err.message}`);
});
