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
      findUnique: jest.fn(),
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

  test('POST /api/orders/execute should create a LIMIT order', async () => {
    (prisma.order.create as jest.Mock).mockResolvedValue({
      id: 'order-limit-123',
      status: 'PENDING',
      type: 'LIMIT',
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 1,
      limitPrice: 150
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        type: 'LIMIT',
        limitPrice: 150
      }
    });

    expect(response.statusCode).toBe(201);
    expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
            type: 'LIMIT',
            limitPrice: 150
        })
    });
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

  test('GET /api/orders/:id should return order details', async () => {
    const mockOrder = {
      id: 'order-123',
      status: 'CONFIRMED',
      type: 'MARKET',
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 1,
    };

    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/order-123',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual(mockOrder);
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-123' }
    });
  });

  test('GET /api/orders/:id should return 404 if order not found', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/non-existent',
    });

    expect(response.statusCode).toBe(404);
  });
});
