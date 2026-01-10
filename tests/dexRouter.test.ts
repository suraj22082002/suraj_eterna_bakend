import { DexRouter } from '../src/services/dexRouter';

describe('DexRouter', () => {
  let router: DexRouter;

  beforeEach(() => {
    router = new DexRouter();
  });

  test('should return a Raydium quote', async () => {
    const quote = await router.getRaydiumQuote('SOL', 'USDC', 1);
    expect(quote.dex).toBe('RAYDIUM');
    expect(quote.price).toBeGreaterThan(0);
  });

  test('should return a Meteora quote', async () => {
    const quote = await router.getMeteoraQuote('SOL', 'USDC', 1);
    expect(quote.dex).toBe('METEORA');
    expect(quote.price).toBeGreaterThan(0);
  });

  test('should select the best quote (highest output)', async () => {
    // Mock getRaydiumQuote and getMeteoraQuote to return fixed values
    jest.spyOn(router, 'getRaydiumQuote').mockResolvedValue({ dex: 'RAYDIUM', price: 100, fee: 0.1 });
    jest.spyOn(router, 'getMeteoraQuote').mockResolvedValue({ dex: 'METEORA', price: 105, fee: 0.1 });

    const best = await router.getBestQuote('SOL', 'USDC', 1);
    expect(best.dex).toBe('METEORA');
    expect(best.price).toBe(105);
  });

  test('should select Raydium if it is better', async () => {
    jest.spyOn(router, 'getRaydiumQuote').mockResolvedValue({ dex: 'RAYDIUM', price: 110, fee: 0.1 });
    jest.spyOn(router, 'getMeteoraQuote').mockResolvedValue({ dex: 'METEORA', price: 105, fee: 0.1 });

    const best = await router.getBestQuote('SOL', 'USDC', 1);
    expect(best.dex).toBe('RAYDIUM');
    expect(best.price).toBe(110);
  });
  
  test('executeSwap returns txHash', async () => {
      const result = await router.executeSwap('RAYDIUM', 1);
      expect(result.txHash).toBeDefined();
      expect(result.txHash).toContain('5x');
      expect(result.executedPrice).toBeGreaterThan(0);
  });
});
