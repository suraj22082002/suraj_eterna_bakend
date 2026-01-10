import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { DexRouter } from './dexRouter';
import { prisma } from '../db';
import { orderEvents } from '../utils/events';
import { logger } from '../utils/logger';

// Create a reusable Redis connection instance
const getRedisConnection = () => {
  if (config.REDIS_URL) {
    logger.info('Connecting to Redis using REDIS_URL');
    return new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
  } else {
    logger.info(`Connecting to Redis using host: ${config.REDIS_HOST}, port: ${config.REDIS_PORT}`);
    return new IORedis({ 
      host: config.REDIS_HOST, 
      port: config.REDIS_PORT, 
      maxRetriesPerRequest: null 
    });
  }
};

const redisConnection = getRedisConnection();

redisConnection.on('connect', () => logger.info('Successfully connected to Redis'));
redisConnection.on('error', (err) => logger.error('Redis Connection Error:', err));

export const orderQueue = new Queue('order-execution', { connection: redisConnection });

const router = new DexRouter();

export const processOrder = async (job: Job) => {
  const { orderId, inputToken, outputToken, amount, type, limitPrice } = job.data;
  
  const updateStatus = async (status: string, data?: any) => {
    logger.info(`Order ${orderId}: ${status}`, data || '');
    
    // Update DB
    await prisma.order.update({
      where: { id: orderId },
      data: { status, ...data }
    });
    
    // Emit event for WebSocket
    orderEvents.emit('update', { orderId, status, ...data });
  };

  try {
    // 1. Pending (already set on creation, but confirm here)
    await updateStatus('PENDING');

    // 2. Routing
    await updateStatus('ROUTING');
    const bestQuote = await router.getBestQuote(inputToken, outputToken, amount);
    
    // Handle LIMIT and SNIPER orders
    if ((type === 'LIMIT' || type === 'SNIPER') && limitPrice) {
      const orderTypeLabel = type === 'SNIPER' ? 'Snipe' : 'Limit';
      logger.info(`Order ${orderId}: Checking ${orderTypeLabel} price ${limitPrice} against best quote ${bestQuote.price}`);
      
      // In this simulation, price is output amount. 
      if (bestQuote.price < limitPrice) {
        throw new Error(`${orderTypeLabel} price not met: Expected at least ${limitPrice}, but best quote is ${bestQuote.price.toFixed(2)}`);
      }
      
      if (type === 'SNIPER') {
        logger.info(`Order ${orderId}: Target sniped successfully!`);
      }
    }

    await updateStatus('BUILDING', { dex: bestQuote.dex });

    // 3. Submitted
    await updateStatus('SUBMITTED');

    // 4. Execute (Transaction Settlement)
    const result = await router.executeSwap(bestQuote.dex, amount);

    // 5. Confirmed
    await updateStatus('CONFIRMED', { 
      txHash: result.txHash,
      executionPrice: result.executedPrice
    });

    return result;

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