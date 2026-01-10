import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { orderQueue } from '../services/orderQueue';
import { prisma } from '../db';

const OrderSchema = z.object({
  inputToken: z.string(),
  outputToken: z.string(),
  amount: z.number().positive(),
  type: z.enum(['MARKET', 'LIMIT', 'SNIPER']).default('MARKET')
});

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.post('/execute', async (request, reply) => {
    try {
      const body = OrderSchema.parse(request.body);
      
      // Create Order in DB
      const order = await prisma.order.create({
        data: {
          type: body.type,
          inputToken: body.inputToken,
          outputToken: body.outputToken,
          amount: body.amount,
          status: 'PENDING'
        }
      });

      // Add to Queue
      await orderQueue.add('execute-order', {
        orderId: order.id,
        ...body
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      });

      return reply.code(201).send({ 
        orderId: order.id,
        message: "Order queued",
        wsUrl: `ws://localhost:${process.env.PORT || 3000}/ws?orderId=${order.id}`
      });

    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({ error: error.message || "Invalid request" });
    }
  });

  fastify.get('/history', async (request, reply) => {
      const orders = await prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50
      });
      return orders;
  });
}
