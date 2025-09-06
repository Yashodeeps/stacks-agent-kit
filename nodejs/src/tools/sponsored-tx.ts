import { 
  makeSTXTokenTransfer,
  makeContractCall,
  sponsorTransaction,
  broadcastTransaction,
  BytesReader,
  deserializeTransaction,
  getAddressFromPrivateKey,
  ClarityValue,
  PostCondition,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface SponsoredSTXTransferParams {
  originPrivateKey: string;
  recipient: string;
  amount: string;
  memo?: string;
}

export interface SponsoredContractCallParams {
  originPrivateKey: string;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditions?: PostCondition[];
  validateWithAbi?: boolean;
}

export interface SponsorTransactionParams {
  transactionHex: string;
  sponsorPrivateKey: string;
  fee: string;
  sponsorNonce?: number;
}

export interface SponsoredTransaction {
  transactionHex: string;
  originAddress: string;
  sponsorAddress?: string;
  isSponsored: boolean;
  fee?: string;
}

export class StacksSponsoredTransactionTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async createSponsoredSTXTransfer(params: SponsoredSTXTransferParams): Promise<ToolResult<SponsoredTransaction>> {
    try {
      const { originPrivateKey, recipient, amount, memo = '' } = params;

      // Convert amount to microSTX
      const microSTXAmount = this.parseSTX(amount);
      
      // Get origin address
      const originAddress = getAddressFromPrivateKey(originPrivateKey, this.getNetworkVersion());

      // Create the sponsored transaction (fee is set to 0 for origin)
      const txOptions = {
        recipient,
        amount: BigInt(microSTXAmount),
        senderKey: originPrivateKey,
        network: this.network,
        memo,
        fee: BigInt(0), // Origin pays no fee in sponsored transactions
        sponsored: true, // This makes it a sponsored transaction
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeSTXTokenTransfer(txOptions);
      const serializedTx = transaction.serialize();
      const transactionHex = Buffer.from(serializedTx).toString('hex');

      return {
        success: true,
        data: {
          transactionHex,
          originAddress,
          isSponsored: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sponsored STX transfer',
      };
    }
  }

  async createSponsoredContractCall(params: SponsoredContractCallParams): Promise<ToolResult<SponsoredTransaction>> {
    try {
      const { 
        originPrivateKey,
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions = [],
        validateWithAbi = true
      } = params;

      // Get origin address
      const originAddress = getAddressFromPrivateKey(originPrivateKey, this.getNetworkVersion());

      // Create the sponsored contract call (fee is set to 0 for origin)
      const txOptions = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderKey: originPrivateKey,
        validateWithAbi,
        network: this.network,
        postConditions,
        postConditionMode: postConditions.length > 0 ? PostConditionMode.Deny : PostConditionMode.Allow,
        fee: BigInt(0), // Origin pays no fee in sponsored transactions
        sponsored: true, // This makes it a sponsored transaction
        anchorMode: AnchorMode.Any,
      };

      const transaction = await makeContractCall(txOptions);
      const serializedTx = transaction.serialize();
      const transactionHex = Buffer.from(serializedTx).toString('hex');

      return {
        success: true,
        data: {
          transactionHex,
          originAddress,
          isSponsored: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sponsored contract call',
      };
    }
  }

  async sponsorTransaction(params: SponsorTransactionParams): Promise<ToolResult<SponsoredTransaction>> {
    try {
      const { transactionHex, sponsorPrivateKey, fee, sponsorNonce } = params;

      // Deserialize the origin transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const deserializedTx = deserializeTransaction(bytesReader);

      // Get sponsor address
      const sponsorAddress = getAddressFromPrivateKey(sponsorPrivateKey, this.getNetworkVersion());

      // Get sponsor nonce if not provided
      let currentSponsorNonce = sponsorNonce;
      if (currentSponsorNonce === undefined) {
        const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${sponsorAddress}`);
        if (!accountResponse.ok) {
          throw new Error(`Failed to fetch sponsor account: ${accountResponse.statusText}`);
        }
        const accountInfo = await accountResponse.json();
        currentSponsorNonce = parseInt(accountInfo.nonce || '0');
      }

      // Sponsor the transaction
      const sponsorOptions = {
        transaction: deserializedTx,
        sponsorPrivateKey,
        fee: BigInt(this.parseSTX(fee)),
        sponsorNonce: currentSponsorNonce,
      };

      const sponsoredTx = await sponsorTransaction(sponsorOptions);
      const sponsoredTxHex = Buffer.from(sponsoredTx.serialize()).toString('hex');

      // Get origin address from the transaction
      const originAddress = deserializedTx.auth.spendingCondition?.signer || '';

      return {
        success: true,
        data: {
          transactionHex: sponsoredTxHex,
          originAddress,
          sponsorAddress,
          isSponsored: true,
          fee: this.formatSTX(fee),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sponsor transaction',
      };
    }
  }

  async broadcastSponsoredTransaction(transactionHex: string): Promise<ToolResult<string>> {
    try {
      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Note: Sponsored transaction verification simplified
      // In the current API, sponsored transactions are handled differently

      // Broadcast the transaction
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: this.network,
      });

      if ('error' in broadcastResponse) {
        throw new Error(`Transaction failed: ${broadcastResponse.error}`);
      }

      return {
        success: true,
        data: 'Sponsored transaction broadcast successfully',
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to broadcast sponsored transaction',
      };
    }
  }

  async getSponsoredTransactionInfo(transactionHex: string): Promise<ToolResult<SponsoredTransaction>> {
    try {
      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Get transaction details - simplified for current API
      const originAddress = transaction.auth.spendingCondition?.signer || '';
      const sponsorAddress = ''; // Would need to be extracted properly
      const isSponsored = true; // Simplified assumption
      const fee = '0'; // Would need to be extracted properly

      return {
        success: true,
        data: {
          transactionHex,
          originAddress,
          sponsorAddress: isSponsored ? sponsorAddress : undefined,
          isSponsored,
          fee: isSponsored ? this.formatSTX(fee) : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sponsored transaction info',
      };
    }
  }

  async estimateSponsorFee(transactionHex: string): Promise<ToolResult<string>> {
    try {
      // Deserialize the transaction to get its size and complexity
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Basic fee estimation based on transaction size
      // This is a simplified estimation - in production, you might want more sophisticated logic
      const txSize = Buffer.from(transactionHex, 'hex').length;
      const baseFee = 1000; // Base fee in microSTX
      const perByteFee = 10; // Fee per byte in microSTX
      const estimatedFee = baseFee + (txSize * perByteFee);

      return {
        success: true,
        data: this.formatSTX(estimatedFee.toString()),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate sponsor fee',
      };
    }
  }

  async validateSponsoredTransaction(transactionHex: string): Promise<ToolResult<{ valid: boolean; issues: string[] }>> {
    try {
      const issues: string[] = [];

      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Simplified validation for current API
      const originAddress = transaction.auth.spendingCondition?.signer || '';
      const sponsorAddress = ''; // Would need proper extraction
      const originFee = transaction.auth.spendingCondition?.fee?.toString() || '0';
      
      if (originFee !== '0') {
        issues.push('Origin should not pay fees in sponsored transactions');
      }

      if (!this.isValidAddress(originAddress)) {
        issues.push('Invalid origin address');
      }

      if (!this.isValidAddress(sponsorAddress)) {
        issues.push('Invalid sponsor address');
      }

      if (originAddress === sponsorAddress) {
        issues.push('Origin and sponsor addresses should be different');
      }

      return {
        success: true,
        data: {
          valid: issues.length === 0,
          issues,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate sponsored transaction',
      };
    }
  }

  private parseSTX(stx: string | bigint | number): bigint {
    if (typeof stx === 'bigint') {
      return stx;
    }
    if (typeof stx === 'number') {
      return BigInt(Math.floor(stx * 1_000_000));
    }
    if (!stx.includes('.')) {
      return BigInt(stx);
    }
    const [whole, decimal = '0'] = stx.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return BigInt(`${whole}${paddedDecimal}`);
  }

  private formatSTX(microSTX: string): string {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, '0')}`;
  }

  private isValidAddress(address: string): boolean {
    // Basic Stacks address validation
    return /^[SM][0-9A-Z]{40}$/.test(address) || /^ST[0-9A-Z]{38}$/.test(address);
  }

  private getNetworkVersion(): 'mainnet' | 'testnet' {
    return this.network.chainId === 1 ? 'mainnet' : 'testnet';
  }
}
