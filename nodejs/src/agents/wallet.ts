import { StateGraph, END } from '@langchain/langgraph';
import { StacksAgent } from './base.js';
import { StacksQueryTool } from '../tools/query';
import { StacksTransferTool } from '../tools/transfer';
import { AgentConfig, QueryParams, TransferParams } from '../types/index';

export class StacksWalletAgent extends StacksAgent {
  private queryTool: StacksQueryTool;
  private transferTool: StacksTransferTool;

  constructor(config: AgentConfig) {
    super(config);
    this.queryTool = new StacksQueryTool(this.network);
    this.transferTool = new StacksTransferTool(this.network);
  }

  getTools() {
    return [
      {
        name: 'query_wallet',
        description: 'Query wallet information including balance, nonce, and transaction history',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The Stacks wallet address to query',
            },
            includeTransactions: {
              type: 'boolean',
              description: 'Whether to include transaction history',
              default: false,
            },
            limit: {
              type: 'number',
              description: 'Maximum number of transactions to return',
              default: 10,
            },
          },
          required: ['address'],
        },
        execute: async (params: QueryParams) => {
          return await this.queryTool.queryWallet(params);
        },
      } as any,
      {
        name: 'get_balance',
        description: 'Get the STX balance of a wallet address',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The Stacks wallet address',
            },
          },
          required: ['address'],
        },
        execute: async (params: { address: string }) => {
          return await this.queryTool.getAccountBalance(params.address);
        },
      } as any,
      {
        name: 'transfer_stx',
        description: 'Transfer STX tokens from one wallet to another',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the sender wallet',
            },
            toAddress: {
              type: 'string',
              description: 'Address of the recipient wallet',
            },
            amount: {
              type: 'string',
              description: 'Amount of STX to transfer (e.g., "1.5" for 1.5 STX)',
            },
            memo: {
              type: 'string',
              description: 'Optional memo for the transaction',
            },
            fee: {
              type: 'string',
              description: 'Optional custom fee (in STX)',
            },
          },
          required: ['fromPrivateKey', 'toAddress', 'amount'],
        },
        execute: async (params: TransferParams) => {
          return await this.transferTool.transferSTX(params);
        },
      } as any,
      {
        name: 'estimate_transfer_fee',
        description: 'Estimate the fee for a STX transfer',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the sender wallet',
            },
            toAddress: {
              type: 'string',
              description: 'Address of the recipient wallet',
            },
            amount: {
              type: 'string',
              description: 'Amount of STX to transfer',
            },
            memo: {
              type: 'string',
              description: 'Optional memo for the transaction',
            },
          },
          required: ['fromPrivateKey', 'toAddress', 'amount'],
        },
        execute: async (params: Omit<TransferParams, 'fee'>) => {
          return await this.transferTool.estimateTransferFee(params);
        },
      } as any,
      {
        name: 'validate_transfer',
        description: 'Validate if a transfer can be executed (check balance, address validity)',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the sender wallet',
            },
            toAddress: {
              type: 'string',
              description: 'Address of the recipient wallet',
            },
            amount: {
              type: 'string',
              description: 'Amount of STX to transfer',
            },
          },
          required: ['fromPrivateKey', 'toAddress', 'amount'],
        },
        execute: async (params: Omit<TransferParams, 'fee' | 'memo'>) => {
          return await this.transferTool.validateTransfer(params);
        },
      } as any,
    ];
  }

  // Individual tool methods for direct access by name
  async queryWallet(params: QueryParams) {
    return await this.queryTool.queryWallet(params);
  }

  async getBalance(params: { address: string }) {
    return await this.queryTool.getAccountBalance(params.address);
  }

  async transferSTX(params: TransferParams) {
    return await this.transferTool.transferSTX(params);
  }

  async estimateTransferFee(params: Omit<TransferParams, 'fee'>) {
    return await this.transferTool.estimateTransferFee(params);
  }

  async validateTransfer(params: Omit<TransferParams, 'fee' | 'memo'>) {
    return await this.transferTool.validateTransfer(params);
  }

  async executeWorkflow(workflow: string, params: any) {
    // Simplified workflow execution without complex graph edges
    const tools = this.getTools();
    
    if (workflow === 'simple_query') {
      const queryTool = tools.find(t => t.name === 'query_wallet');
      if (queryTool) {
        return await queryTool.execute(params);
      }
    } else if (workflow === 'simple_transfer') {
      const validateTool = tools.find(t => t.name === 'validate_transfer');
      const transferTool = tools.find(t => t.name === 'transfer_stx');
      
      if (validateTool && transferTool) {
        const validation = await validateTool.execute(params);
        if (validation.success && validation.data) {
          return await transferTool.execute(params);
        } else {
          return { success: false, error: 'Transfer validation failed' };
        }
      }
    }
    
    return { success: false, error: 'Unknown workflow' };
  }
}
