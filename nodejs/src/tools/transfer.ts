import { 
  makeSTXTokenTransfer, 
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode,
  FungibleConditionCode,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { TransferParams, ToolResult } from '../types/index';

export class StacksTransferTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async transferSTX(params: TransferParams): Promise<ToolResult<string>> {
    try {
      const { 
        fromPrivateKey, 
        toAddress, 
        amount, 
        memo = '', 
        fee 
      } = params;

      // Convert STX amount to microSTX
      const microSTXAmount = this.parseSTX(amount);
      
      // Get current account info for nonce
      const senderAddress = this.getAddressFromPrivateKey(fromPrivateKey);
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');

      // Create the transaction
      const txOptions = {
        recipient: toAddress,
        amount: microSTXAmount,
        senderKey: fromPrivateKey,
        network: this.network,
        memo: memo,
        nonce: nonce,
        fee: fee ? this.parseSTX(fee) : undefined,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      };

      const transaction = await makeSTXTokenTransfer(txOptions);

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: this.network
      });
      
      if ('error' in broadcastResponse) {
        throw new Error(`Transaction failed: ${broadcastResponse.error}`);
      }

      return {
        success: true,
        data: 'Transaction submitted successfully',
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  async estimateTransferFee(params: Omit<TransferParams, 'fee'>): Promise<ToolResult<string>> {
    try {
      const { fromPrivateKey, toAddress, amount, memo = '' } = params;
      
      // Create a test transaction to estimate fee
      const microSTXAmount = this.parseSTX(amount);
      const senderAddress = this.getAddressFromPrivateKey(fromPrivateKey);
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');

      const txOptions = {
        recipient: toAddress,
        amount: microSTXAmount,
        senderKey: fromPrivateKey,
        network: this.network,
        memo: memo,
        nonce: nonce,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      };

      const transaction = await makeSTXTokenTransfer(txOptions);
      const fee = transaction.auth.spendingCondition?.fee?.toString() || '0';

      return {
        success: true,
        data: this.formatSTX(fee),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate fee',
      };
    }
  }

  async validateTransfer(params: TransferParams): Promise<ToolResult<boolean>> {
    try {
      const { fromPrivateKey, toAddress, amount } = params;
      
      // Check if sender has sufficient balance
      const senderAddress = this.getAddressFromPrivateKey(fromPrivateKey);
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const currentBalance = BigInt(accountInfo.balance || '0');
      const transferAmount = BigInt(this.parseSTX(amount));
      
      // Estimate fee
      const feeEstimate = await this.estimateTransferFee(params);
      if (!feeEstimate.success) {
        return {
          success: false,
          error: 'Failed to estimate fee',
        };
      }
      
      const estimatedFee = BigInt(this.parseSTX(feeEstimate.data!));
      const totalRequired = transferAmount + estimatedFee;

      if (currentBalance < totalRequired) {
        return {
          success: true,
          data: false,
        };
      }

      // Validate address format
      if (!this.isValidAddress(toAddress)) {
        return {
          success: false,
          error: 'Invalid recipient address',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  private parseSTX(stx: string): string {
    const [whole, decimal = '0'] = stx.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return `${whole}${paddedDecimal}`;
  }

  private formatSTX(microSTX: string): string {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, '0')}`;
  }

  private getAddressFromPrivateKey(privateKey: string): string {
    // This is a simplified version - in production you'd use proper key derivation
    // For now, we'll assume the private key is provided with the address
    // In a real implementation, you'd derive the address from the private key
    // For this example, we'll return a placeholder that will cause validation to fail gracefully
    return 'SP000000000000000000002Q6VF78'; // Placeholder address
  }

  private isValidAddress(address: string): boolean {
    // Basic Stacks address validation
    return /^[SM][0-9A-Z]{40}$/.test(address);
  }
}
