import { Job } from 'bullmq';
import { processOrder } from '../src/services/orderQueue';
import { prisma } from '../src/db';
import { DexRouter } from '../src/services/dexRouter';

// Mock dependencies
jest.mock('../src/db', () => ({
  prisma: {
    order: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/services/dexRouter');

describe('Order Worker Processor', () => {
  let mockJob: Partial<Job>;
  let mockRouter: jest.Mocked<DexRouter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJob = {
      data: {
        orderId: 'order-123',
        inputToken: 'SOL',
        outputToken: 'USDC',
        amount: 1,
        type: 'MARKET'
      }
    };
    mockRouter = new DexRouter() as jest.Mocked<DexRouter>;
    (DexRouter as jest.Mock).mockImplementation(() => mockRouter);
  });

  test('should fail if LIMIT price is not met', async () => {
    mockJob.data = {
      ...mockJob.data,
      type: 'LIMIT',
      limitPrice: 200 // Higher than what mocked router will return
    };

    // We need to mock getBestQuote on the instance that processOrder uses.
    // Since processOrder uses a router instance created at module level, 
    // we should mock the prototype or the module.
    
    const dexRouterProto = require('../src/services/dexRouter').DexRouter.prototype;
    jest.spyOn(dexRouterProto, 'getBestQuote').mockResolvedValue({
      dex: 'RAYDIUM',
      price: 150, // Less than 200
      fee: 0.1
    });

    await expect(processOrder(mockJob as Job)).rejects.toThrow('Limit price not met');
    
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' })
    }));
  });

  test('should succeed if LIMIT price is met', async () => {
    mockJob.data = {
      ...mockJob.data,
      type: 'LIMIT',
      limitPrice: 100 // Lower than what mocked router will return
    };

    const dexRouterProto = require('../src/services/dexRouter').DexRouter.prototype;
    jest.spyOn(dexRouterProto, 'getBestQuote').mockResolvedValue({
      dex: 'RAYDIUM',
      price: 150, // More than 100
      fee: 0.1
    });
    jest.spyOn(dexRouterProto, 'executeSwap').mockResolvedValue({
      txHash: '0x123',
      executedPrice: 150
    });

    await processOrder(mockJob as Job);
    
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' })
    }));
  });

  test('should succeed if SNIPER price is met', async () => {
    mockJob.data = {
      ...mockJob.data,
      type: 'SNIPER',
      limitPrice: 140
    };

    const dexRouterProto = require('../src/services/dexRouter').DexRouter.prototype;
    jest.spyOn(dexRouterProto, 'getBestQuote').mockResolvedValue({
      dex: 'METEORA',
      price: 150,
      fee: 0.1
    });
    jest.spyOn(dexRouterProto, 'executeSwap').mockResolvedValue({
      txHash: '0x-snipe-123',
      executedPrice: 150
    });

    await processOrder(mockJob as Job);
    
    expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' })
    }));
  });
});