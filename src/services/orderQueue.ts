import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { DexRouter } from './dexRouter';
import { prisma } from '../db';
import { orderEvents } from '../utils/events';
import { logger } from '../utils/logger';

const connection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT
};

export const orderQueue = new Queue('order-execution', { connection });

const router = new DexRouter();

// Worker implementation
const worker = new Worker('order-execution', async (job: Job) => {
  const { orderId, inputToken, outputToken, amount } = job.data;
  
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
}, { 
  connection,
  concurrency: 10, // Max 10 concurrent orders
  limiter: {
    max: 100,
    duration: 60000 // 100 orders per minute
  }
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with ${err.message}`);
});
