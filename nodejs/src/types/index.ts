// types/index.ts - Updated to include conversational agent types

export interface AgentConfig {
  network: {
    network: "mainnet" | "testnet";
    coreApiUrl?: string;
    broadcastApiUrl?: string;
  };
  defaultFee?: string;
  // New optional properties for conversational agent
  openAIApiKey?: string;
  model?: string;
}

export interface QueryParams {
  address: string;
  includeTransactions?: boolean;
  limit?: number;
}

export interface TransferParams {
  fromPrivateKey: string;
  toAddress: string;
  amount: string;
  memo?: string;
  fee?: string;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string;
}

// New types for conversational agent
export interface ConversationAnalysis {
  needsTool: boolean;
  toolName?: string;
  parameters?: Record<string, any>;
  missingInfo?: string[];
  intent: string;
}

export interface ChatSession {
  sessionId: string;
  userAddress?: string;
  context: Record<string, any>;
  messageHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}

export interface AgentResponse {
  message: string;
  toolUsed?: string;
  success: boolean;
  data?: any;
  error?: string;
}

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
  status: "pending" | "success" | "failed";
  timestamp: number;
  blockHeight?: number;
}

export interface TransferParams {
  fromPrivateKey: string;
  toAddress: string;
  amount: string; // in microSTX (1 STX = 1,000,000 microSTX)
  memo?: string;
  fee?: string; // optional fee override
}

export interface QueryParams {
  address: string;
  includeTransactions?: boolean;
  limit?: number;
}

export interface StacksNetworkConfig {
  network: "mainnet" | "testnet";
  coreApiUrl?: string;
  broadcastApiUrl?: string;
}

export interface AgentConfig {
  network: StacksNetworkConfig;
  defaultFee?: string;
}
