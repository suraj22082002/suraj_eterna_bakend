export interface DexQuote {
  dex: 'RAYDIUM' | 'METEORA';
  price: number;
  fee: number;
}

export interface OrderRequest {
  inputToken: string;
  outputToken: string;
  amount: number;
}

export interface OrderStatus {
  status: 'PENDING' | 'ROUTING' | 'BUILDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
  txHash?: string;
  error?: string;
  dex?: string;
  executionPrice?: number;
}
