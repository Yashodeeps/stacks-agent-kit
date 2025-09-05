import { StacksNetwork } from '@stacks/network';
import { QueryParams, WalletInfo, TransactionInfo, ToolResult } from '../types/index';

export class StacksQueryTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async queryWallet(params: QueryParams): Promise<ToolResult<WalletInfo>> {
    try {
      const { address, includeTransactions = false, limit = 10 } = params;

      // Get account info
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${address}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      
      const walletInfo: WalletInfo = {
        address,
        balance: accountInfo.balance || '0',
        balanceFormatted: this.formatSTX(accountInfo.balance || '0'),
        nonce: parseInt(accountInfo.nonce || '0'),
      };

      let transactions: TransactionInfo[] = [];
      if (includeTransactions) {
        transactions = await this.getTransactionHistory(address, limit);
      }

      return {
        success: true,
        data: {
          ...walletInfo,
          transactions,
        } as any,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query wallet',
      };
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<TransactionInfo[]> {
    try {
      const response = await fetch(
        `${this.network.client.baseUrl}/extended/v1/address/${address}/transactions?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.results.map((tx: any) => ({
        txId: tx.tx_id,
        type: tx.tx_type,
        amount: tx.token_transfer?.amount || tx.stx_transfers?.[0]?.amount,
        from: tx.sender_address,
        to: tx.token_transfer?.recipient_address || tx.stx_transfers?.[0]?.recipient_address,
        fee: tx.fee_rate,
        status: tx.tx_status === 'success' ? 'success' : 
                tx.tx_status === 'pending' ? 'pending' : 'failed',
        timestamp: tx.burn_block_time,
        blockHeight: tx.block_height,
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  async getAccountBalance(address: string): Promise<ToolResult<string>> {
    try {
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${address}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const balance = accountInfo.balance || '0';
      
      return {
        success: true,
        data: this.formatSTX(balance),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      };
    }
  }

  async getAccountNonce(address: string): Promise<ToolResult<number>> {
    try {
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${address}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');
      
      return {
        success: true,
        data: nonce,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get nonce',
      };
    }
  }

  private formatSTX(microSTX: string): string {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, '0')}`;
  }
}
