import { StateGraph, END } from '@langchain/langgraph';
import { StacksAgent } from './agent.js';
import { StacksQueryTool } from '../tools/query.js';
import { StacksTransferTool } from '../tools/transfer.js';
import { StacksSwapTool } from '../tools/swap.js';
import { AgentConfig, QueryParams, TransferParams, SwapParams } from '../types/index';

export class StacksWalletAgent extends StacksAgent {
  private queryTool: StacksQueryTool;
  private transferTool: StacksTransferTool;
  private swapTool: StacksSwapTool;

  constructor(config: AgentConfig) {
    super(config);
    this.queryTool = new StacksQueryTool(this.network);
    this.transferTool = new StacksTransferTool(this.network);
    this.swapTool = new StacksSwapTool(this.network);
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
          // Use initialized private key if no private key provided in params
          const transferParams = {
            ...params,
            fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
          };
          
          if (!transferParams.fromPrivateKey) {
            return {
              success: false,
              error: 'No private key provided. Either initialize a private key in the agent config or provide one in the transfer parameters.'
            };
          }
          
          return await this.transferTool.transferSTX(transferParams);
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
          // Use initialized private key if no private key provided in params
          const estimateParams = {
            ...params,
            fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
          };
          
          if (!estimateParams.fromPrivateKey) {
            return {
              success: false,
              error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
            };
          }
          
          return await this.transferTool.estimateTransferFee(estimateParams);
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
          // Use initialized private key if no private key provided in params
          const validateParams = {
            ...params,
            fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
          };
          
          if (!validateParams.fromPrivateKey) {
            return {
              success: false,
              error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
            };
          }
          
          return await this.transferTool.validateTransfer(validateParams);
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
    // Use initialized private key if no private key provided in params
    const transferParams = {
      ...params,
      fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
    };
    
    if (!transferParams.fromPrivateKey) {
      return {
        success: false,
        error: 'No private key provided. Either initialize a private key in the agent config or provide one in the transfer parameters.'
      };
    }
    
    return await this.transferTool.transferSTX(transferParams);
  }

  async estimateTransferFee(params: Omit<TransferParams, 'fee'>) {
    // Use initialized private key if no private key provided in params
    const estimateParams = {
      ...params,
      fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
    };
    
    if (!estimateParams.fromPrivateKey) {
      return {
        success: false,
        error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
      };
    }
    
    return await this.transferTool.estimateTransferFee(estimateParams);
  }

  async validateTransfer(params: Omit<TransferParams, 'fee' | 'memo'>) {
    // Use initialized private key if no private key provided in params
    const validateParams = {
      ...params,
      fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
    };
    
    if (!validateParams.fromPrivateKey) {
      return {
        success: false,
        error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
      };
    }
    
    return await this.transferTool.validateTransfer(validateParams);
  }

  async getSwapQuote(params: SwapParams) {
    const swapParams = {
      ...params,
      fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
    };

    if (!swapParams.fromPrivateKey) {
      return {
        success: false,
        error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
      };
    }

    return await this.swapTool.getSwapQuote(swapParams);
  }

  async swapSTXForSBTC(params: SwapParams) {
    const swapParams = {
      ...params,
      fromPrivateKey: params.fromPrivateKey || this.initializedKey?.privateKey || params.fromPrivateKey
    };

    if (!swapParams.fromPrivateKey) {
      return {
        success: false,
        error: 'No private key provided. Either initialize a private key in the agent config or provide one in the parameters.'
      };
    }

    return await this.swapTool.swapSTXForSBTC(swapParams);
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

  async executePrompt(prompt: string): Promise<any> {
    try {
      // Match prompt to relevant tools and extract parameters
      const { tools: relevantTools, parameters, error } = await this.matchPromptToTools(prompt);
      
      if (error) {
        return {
          success: false,
          error
        };
      }
      
      if (relevantTools.length === 0) {
        return {
          success: false,
          error: 'No relevant tools found for the given prompt.'
        };
      }

      // If only one tool is relevant, execute it with extracted parameters
      if (relevantTools.length === 1) {
        const tool = relevantTools[0];
        
        // Add initialized private key to parameters if available and needed
        if (this.initializedKey && (tool.name === 'transfer_stx' || tool.name === 'estimate_transfer_fee' || tool.name === 'validate_transfer')) {
          parameters.fromPrivateKey = parameters.fromPrivateKey || this.initializedKey.privateKey;
        }
        
        return await tool.execute(parameters);
      }

      // If multiple tools are relevant, return them for user to choose
      return {
        success: true,
        data: {
          message: 'Multiple tools are relevant to your prompt. Please specify which one to use:',
          relevantTools: relevantTools.map(tool => ({
            name: tool.name,
            description: tool.description
          })),
          extractedParameters: parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute prompt: ${error}`
      };
    }
  }
}