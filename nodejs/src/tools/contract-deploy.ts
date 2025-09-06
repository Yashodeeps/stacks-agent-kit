import { 
  makeContractDeploy, 
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode,
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface ContractDeployParams {
  fromPrivateKey: string;
  contractName: string;
  codeBody: string;
  fee?: string; // optional fee override
  nonce?: number; // optional nonce override
}

export class StacksContractDeployTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async deployContract(params: ContractDeployParams): Promise<ToolResult<string>> {
    try {
      const { 
        fromPrivateKey, 
        contractName, 
        codeBody, 
        fee,
        nonce 
      } = params;

      // Get current account info for nonce if not provided
      const senderAddress = getAddressFromPrivateKey(fromPrivateKey, this.getNetworkVersion());
      let currentNonce = nonce;
      
      if (currentNonce === undefined) {
        const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
        if (!accountResponse.ok) {
          throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
        }
        const accountInfo = await accountResponse.json();
        currentNonce = parseInt(accountInfo.nonce || '0');
      }

      // Create the contract deploy transaction
      const txOptions = {
        contractName,
        codeBody,
        senderKey: fromPrivateKey,
        network: this.network,
        nonce: BigInt(currentNonce),
        fee: fee ? BigInt(this.parseSTX(fee)) : undefined,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractDeploy(txOptions);

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
        data: `Contract '${contractName}' deployed successfully`,
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract deployment failed',
      };
    }
  }

  async estimateDeployFee(params: Omit<ContractDeployParams, 'fee'>): Promise<ToolResult<string>> {
    try {
      const { fromPrivateKey, contractName, codeBody } = params;
      
      // Get current account info for nonce
      const senderAddress = getAddressFromPrivateKey(fromPrivateKey, this.getNetworkVersion());
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');

      // Create a test transaction to estimate fee
      const txOptions = {
        contractName,
        codeBody,
        senderKey: fromPrivateKey,
        network: this.network,
        nonce: BigInt(nonce),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractDeploy(txOptions);
      const fee = transaction.auth.spendingCondition?.fee?.toString() || '0';

      return {
        success: true,
        data: this.formatSTX(fee),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate deploy fee',
      };
    }
  }

  async validateContract(params: Pick<ContractDeployParams, 'contractName' | 'codeBody'>): Promise<ToolResult<boolean>> {
    try {
      const { contractName, codeBody } = params;
      
      // Basic validation
      if (!contractName || contractName.length === 0) {
        return {
          success: false,
          error: 'Contract name cannot be empty',
        };
      }

      if (!codeBody || codeBody.length === 0) {
        return {
          success: false,
          error: 'Contract code cannot be empty',
        };
      }

      // Check contract name format (alphanumeric, hyphens, underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(contractName)) {
        return {
          success: false,
          error: 'Contract name can only contain letters, numbers, hyphens, and underscores',
        };
      }

      // Check contract name length (max 40 characters)
      if (contractName.length > 40) {
        return {
          success: false,
          error: 'Contract name cannot exceed 40 characters',
        };
      }

      // Basic Clarity syntax check (look for common patterns)
      if (!codeBody.includes('(define-') && !codeBody.includes('(impl-trait')) {
        return {
          success: false,
          error: 'Contract code must contain at least one function or trait implementation',
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract validation failed',
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

  private getNetworkVersion(): 'mainnet' | 'testnet' {
    // Check if it's mainnet based on the network name or chainId
    return this.network.chainId === 1 ? 'mainnet' : 'testnet';
  }
}
