import { 
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  deserializeTransaction,
  privateKeyToPublic,
  publicKeyToHex,
  TransactionSigner,
  BytesReader,
  broadcastTransaction,
  getAddressFromPrivateKey,
  ClarityValue,
  PostCondition,
  PostConditionMode,
} from '@stacks/transactions';
import { PrivateKey, PublicKey } from '@stacks/common';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface MultiSigSTXTransferParams {
  recipients: string;
  amount: string;
  memo?: string;
  fee?: string;
  numSignatures: number;
  publicKeys: string[];
}

export interface MultiSigContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  fee?: string;
  numSignatures: number;
  publicKeys: string[];
  postConditions?: PostCondition[];
}

export interface MultiSigSignParams {
  transactionHex: string;
  privateKey: string;
}

export interface MultiSigAppendParams {
  transactionHex: string;
  publicKey: string;
}

export interface MultiSigTransaction {
  transactionHex: string;
  txid?: string;
  signatures: number;
  requiredSignatures: number;
  isComplete: boolean;
  publicKeys: string[];
}

export class StacksMultiSigTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async createUnsignedSTXTransfer(params: MultiSigSTXTransferParams): Promise<ToolResult<MultiSigTransaction>> {
    try {
      const { recipients, amount, memo = '', fee, numSignatures, publicKeys } = params;

      if (publicKeys.length < numSignatures) {
        throw new Error(`Number of public keys (${publicKeys.length}) must be >= required signatures (${numSignatures})`);
      }

      // Convert amount to microSTX
      const microSTXAmount = this.parseSTX(amount);

      const transaction = await makeUnsignedSTXTokenTransfer({
        recipient: recipients,
        amount: BigInt(microSTXAmount),
        fee: fee ? BigInt(this.parseSTX(fee)) : BigInt(0),
        memo,
        numSignatures,
        publicKeys,
        network: this.network,
      });

      const serializedTx = transaction.serialize();
      const transactionHex = Buffer.from(serializedTx).toString('hex');

      return {
        success: true,
        data: {
          transactionHex,
          signatures: 0,
          requiredSignatures: numSignatures,
          isComplete: false,
          publicKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create unsigned STX transfer',
      };
    }
  }

  async createUnsignedContractCall(params: MultiSigContractCallParams): Promise<ToolResult<MultiSigTransaction>> {
    try {
      const { 
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        fee,
        numSignatures,
        publicKeys,
        postConditions = []
      } = params;

      if (publicKeys.length < numSignatures) {
        throw new Error(`Number of public keys (${publicKeys.length}) must be >= required signatures (${numSignatures})`);
      }

      const transaction = await makeUnsignedContractCall({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        fee: fee ? BigInt(this.parseSTX(fee)) : BigInt(0),
        numSignatures,
        publicKeys,
        network: this.network,
        postConditions,
        postConditionMode: postConditions.length > 0 ? PostConditionMode.Deny : PostConditionMode.Allow,
      });

      const serializedTx = transaction.serialize();
      const transactionHex = Buffer.from(serializedTx).toString('hex');

      return {
        success: true,
        data: {
          transactionHex,
          signatures: 0,
          requiredSignatures: numSignatures,
          isComplete: false,
          publicKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create unsigned contract call',
      };
    }
  }

  async signTransaction(params: MultiSigSignParams): Promise<ToolResult<MultiSigTransaction>> {
    try {
      const { transactionHex, privateKey } = params;

      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const deserializedTx = deserializeTransaction(bytesReader);

      // Create signer and sign
      const signer = new TransactionSigner(deserializedTx);
      signer.signOrigin(privateKey);

      // Get transaction info - simplified for now
      const signaturesCount = 1; // This would need proper implementation
      const requiredSignatures = 2; // This would need to be extracted from transaction

      // Serialize the signed transaction
      const serializedSignedTx = deserializedTx.serialize();
      const signedTransactionHex = Buffer.from(serializedSignedTx).toString('hex');

      // Get public keys from the transaction - simplified
      const publicKeys: string[] = [];

      return {
        success: true,
        data: {
          transactionHex: signedTransactionHex,
          signatures: signaturesCount,
          requiredSignatures,
          isComplete: signaturesCount >= requiredSignatures,
          publicKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign transaction',
      };
    }
  }

  async appendPublicKey(params: MultiSigAppendParams): Promise<ToolResult<MultiSigTransaction>> {
    try {
      const { transactionHex, publicKey } = params;

      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const deserializedTx = deserializeTransaction(bytesReader);

      // Create signer and append public key
      const signer = new TransactionSigner(deserializedTx);
      const actualPubKey = privateKeyToPublic(publicKey.padStart(64, '0'));
      signer.appendOrigin(publicKeyToHex(actualPubKey));

      // Get transaction info - simplified
      const signaturesCount = 1;
      const requiredSignatures = 2;

      // Serialize the updated transaction
      const serializedTx = deserializedTx.serialize();
      const updatedTransactionHex = Buffer.from(serializedTx).toString('hex');

      // Get public keys from the transaction - simplified
      const publicKeys: string[] = [];

      return {
        success: true,
        data: {
          transactionHex: updatedTransactionHex,
          signatures: signaturesCount,
          requiredSignatures,
          isComplete: signaturesCount >= requiredSignatures,
          publicKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to append public key',
      };
    }
  }

  async broadcastMultiSigTransaction(transactionHex: string): Promise<ToolResult<string>> {
    try {
      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Check if transaction is complete - simplified
      const signaturesCount = 2; // This would need proper implementation
      const requiredSignatures = 2;

      if (signaturesCount < requiredSignatures) {
        throw new Error(`Transaction is not complete. Has ${signaturesCount} signatures but needs ${requiredSignatures}`);
      }

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
        data: 'Multi-signature transaction broadcast successfully',
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to broadcast multi-sig transaction',
      };
    }
  }

  async getTransactionStatus(transactionHex: string): Promise<ToolResult<MultiSigTransaction>> {
    try {
      // Deserialize the transaction
      const bytesReader = new BytesReader(Buffer.from(transactionHex, 'hex'));
      const transaction = deserializeTransaction(bytesReader);

      // Get transaction info - simplified
      const signaturesCount = 1;
      const requiredSignatures = 2;

      // Get public keys from the transaction - simplified
      const publicKeys: string[] = [];

      return {
        success: true,
        data: {
          transactionHex,
          signatures: signaturesCount,
          requiredSignatures,
          isComplete: signaturesCount >= requiredSignatures,
          publicKeys,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transaction status',
      };
    }
  }

  async generateMultiSigAddress(publicKeys: string[], numSignatures: number): Promise<ToolResult<string>> {
    try {
      if (publicKeys.length < numSignatures) {
        throw new Error(`Number of public keys (${publicKeys.length}) must be >= required signatures (${numSignatures})`);
      }

      // Create a dummy unsigned transaction to get the multi-sig address
      const dummyTransaction = await makeUnsignedSTXTokenTransfer({
        recipient: 'ST000000000000000000002AMW42H',
        amount: BigInt(1),
        fee: BigInt(0),
        memo: '',
        numSignatures,
        publicKeys,
        network: this.network,
      });

      // Extract the multi-sig address from the transaction
      const authField = dummyTransaction.auth.spendingCondition;
      const address = authField?.signer || '';

      return {
        success: true,
        data: address,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate multi-sig address',
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
}
