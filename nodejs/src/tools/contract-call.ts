import { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode,
  getAddressFromPrivateKey,
  ClarityValue,
} from '@stacks/transactions';
import { PostCondition } from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface ContractCallParams {
  fromPrivateKey: string;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  fee?: string;
  nonce?: number;
  postConditions?: PostConditionSpec[];
  validateWithAbi?: boolean;
}

export interface PostConditionSpec {
  type: 'stx-postcondition' | 'ft-postcondition' | 'nft-postcondition';
  address: string;
  condition: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'sent' | 'not-sent';
  amount?: string | bigint | number;
  asset?: string;
  assetId?: ClarityValue;
}

export class StacksContractCallTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async callContract(params: ContractCallParams): Promise<ToolResult<string>> {
    try {
      const { 
        fromPrivateKey, 
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        fee,
        nonce,
        postConditions = [],
        validateWithAbi = true
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

      // Convert post condition specifications to actual post conditions
      const stacksPostConditions = postConditions as PostCondition[];

      // Create the contract call transaction
      const txOptions = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderKey: fromPrivateKey,
        validateWithAbi,
        network: this.network,
        postConditions: stacksPostConditions,
        postConditionMode: stacksPostConditions.length > 0 ? PostConditionMode.Deny : PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        nonce: BigInt(currentNonce),
        fee: fee ? BigInt(this.parseSTX(fee)) : undefined,
      };

      const transaction = await makeContractCall(txOptions);

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
        data: `Contract function '${functionName}' called successfully`,
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract call failed',
      };
    }
  }

  async estimateCallFee(params: Omit<ContractCallParams, 'fee'>): Promise<ToolResult<string>> {
    try {
      const { 
        fromPrivateKey, 
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions = [],
        validateWithAbi = true
      } = params;
      
      // Get current account info for nonce
      const senderAddress = getAddressFromPrivateKey(fromPrivateKey, this.getNetworkVersion());
      const accountResponse = await fetch(`${this.network.client.baseUrl}/v2/accounts/${senderAddress}`);
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');

      // Convert post condition specifications to actual post conditions
      const stacksPostConditions = postConditions as PostCondition[];

      // Create a test transaction to estimate fee
      const txOptions = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderKey: fromPrivateKey,
        validateWithAbi,
        network: this.network,
        postConditions: stacksPostConditions,
        postConditionMode: stacksPostConditions.length > 0 ? PostConditionMode.Deny : PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        nonce: BigInt(nonce),
      };

      const transaction = await makeContractCall(txOptions);
      const fee = transaction.auth.spendingCondition?.fee?.toString() || '0';

      return {
        success: true,
        data: this.formatSTX(fee),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate call fee',
      };
    }
  }

  async getContractAbi(contractAddress: string, contractName: string): Promise<ToolResult<any>> {
    try {
      const abiResponse = await fetch(
        `${this.network.client.baseUrl}/v2/contracts/interface/${contractAddress}/${contractName}`
      );
      
      if (!abiResponse.ok) {
        throw new Error(`Failed to fetch contract ABI: ${abiResponse.statusText}`);
      }

      const abi = await abiResponse.json();
      
      return {
        success: true,
        data: abi,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract ABI',
      };
    }
  }

  async getContractSource(contractAddress: string, contractName: string): Promise<ToolResult<string>> {
    try {
      const sourceResponse = await fetch(
        `${this.network.client.baseUrl}/v2/contracts/source/${contractAddress}/${contractName}`
      );
      
      if (!sourceResponse.ok) {
        throw new Error(`Failed to fetch contract source: ${sourceResponse.statusText}`);
      }

      const sourceData = await sourceResponse.json();
      
      return {
        success: true,
        data: sourceData.source,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract source',
      };
    }
  }

  // Note: Post conditions are now passed directly as PostCondition objects
  // The new API expects post conditions to be properly constructed before passing to this tool

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
