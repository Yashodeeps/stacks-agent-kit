export interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  nonce: number;
}

export interface TransactionInfo {
  txId: string;
  type: string;
  amount?: string;
  from?: string;
  to?: string;
  fee: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  blockHeight?: number;
}

export interface TransferParams {
  fromPrivateKey: string;
  toAddress: string;
  amount: string | bigint | number; // in microSTX (1 STX = 1,000,000 microSTX)
  memo?: string;
  fee?: string; // optional fee override
}

export interface QueryParams {
  address: string;
  includeTransactions?: boolean;
  limit?: number;
}

export interface StacksNetworkConfig {
  network: 'mainnet' | 'testnet';
  coreApiUrl?: string;
  broadcastApiUrl?: string;
}

export interface AgentConfig {
  privateKey?: string;
  network: StacksNetworkConfig;
  model?: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  defaultFee?: string;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
}

export interface PrivateKeyInfo {
  privateKey: string;
  publicKey: string;
  address: string;
  network: 'mainnet' | 'testnet';
}

export interface KeyInitializationParams {
  privateKey?: string; // Optional: if not provided, will generate a new one
  network: 'mainnet' | 'testnet';
}

export interface SwapParams {
  fromPrivateKey: string;
  amount: string;
  slippageTolerance?: number; // in percentage, default 0.5%
  fee?: string; // optional fee override
}

export interface SwapQuote {
  expectedOutput: string;
  minimumOutput: string;
  fee: string;
  priceImpact: string; // in percentage
  route: string[];
}
