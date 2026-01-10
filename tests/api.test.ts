import Fastify from 'fastify';
import { orderRoutes } from '../src/routes/orders';
import { prisma } from '../src/db';
import { orderQueue } from '../src/services/orderQueue';

// Mock dependencies
jest.mock('../src/db', () => ({
  prisma: {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../src/services/orderQueue', () => ({
  orderQueue: {
    add: jest.fn(),
  },
}));

describe('Order Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify();
    app.register(orderRoutes, { prefix: '/api/orders' });
    await app.ready();
  });

  afterAll(() => {
    app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/orders/execute should create order and return 201', async () => {
    // Mock Prisma response
    (prisma.order.create as jest.Mock).mockResolvedValue({
      id: 'order-123',
      status: 'PENDING',
      type: 'MARKET',
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 1,
    });

    (orderQueue.add as jest.Mock).mockResolvedValue({});

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        type: 'MARKET'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.orderId).toBe('order-123');
    expect(body.wsUrl).toContain('ws://');
    
    // Verify mocks called
    expect(prisma.order.create).toHaveBeenCalled();
    expect(orderQueue.add).toHaveBeenCalledWith('execute-order', expect.objectContaining({
      orderId: 'order-123',
      inputToken: 'SOL'
    }), expect.any(Object));
  });

  test('POST /api/orders/execute should validate input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        inputToken: 'SOL',
        // Missing outputToken
        amount: -1 // Invalid amount
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
