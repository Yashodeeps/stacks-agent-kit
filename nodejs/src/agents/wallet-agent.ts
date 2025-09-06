import { StateGraph, END } from '@langchain/langgraph';
import { StacksAgent } from './agent.js';
import { StacksQueryTool } from '../tools/query.js';
import { StacksTransferTool } from '../tools/transfer.js';
import { StacksSwapTool } from '../tools/swap.js';
import { StacksContractDeployTool } from '../tools/contract-deploy.js';
import { StacksContractCallTool } from '../tools/contract-call.js';
import { StacksReadOnlyTool } from '../tools/readonly-call.js';
import { StacksKeyManagementTool } from '../tools/key-management.js';
import { StacksMultiSigTool } from '../tools/multisig.js';
import { StacksSponsoredTransactionTool } from '../tools/sponsored-tx.js';
import { 
  AgentConfig, 
  QueryParams, 
  TransferParams, 
  SwapParams,
  ContractDeployParams,
  ContractCallParams,
  ReadOnlyCallParams,
  KeyGenerationParams,
  KeyImportParams,
  MultiSigSTXTransferParams,
  MultiSigContractCallParams,
  SponsoredSTXTransferParams,
  SponsoredContractCallParams,
  SponsorTransactionParams
} from '../types/index';

export class StacksWalletAgent extends StacksAgent {
  private queryTool: StacksQueryTool;
  private transferTool: StacksTransferTool;
  private swapTool: StacksSwapTool;
  private contractDeployTool: StacksContractDeployTool;
  private contractCallTool: StacksContractCallTool;
  private readOnlyTool: StacksReadOnlyTool;
  private keyManagementTool: StacksKeyManagementTool;
  private multiSigTool: StacksMultiSigTool;
  private sponsoredTxTool: StacksSponsoredTransactionTool;

  constructor(config: AgentConfig) {
    super(config);
    this.queryTool = new StacksQueryTool(this.network);
    this.transferTool = new StacksTransferTool(this.network);
    this.swapTool = new StacksSwapTool(this.network);
    this.contractDeployTool = new StacksContractDeployTool(this.network);
    this.contractCallTool = new StacksContractCallTool(this.network);
    this.readOnlyTool = new StacksReadOnlyTool(this.network);
    this.keyManagementTool = new StacksKeyManagementTool(this.network);
    this.multiSigTool = new StacksMultiSigTool(this.network);
    this.sponsoredTxTool = new StacksSponsoredTransactionTool(this.network);
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

      // Contract deployment tools
      {
        name: 'deploy_contract',
        description: 'Deploy a smart contract to the Stacks blockchain',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the deployer wallet',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract to deploy',
            },
            codeBody: {
              type: 'string',
              description: 'Clarity code of the contract',
            },
            fee: {
              type: 'string',
              description: 'Optional fee override for the transaction',
            },
          },
          required: ['fromPrivateKey', 'contractName', 'codeBody'],
        },
        execute: async (params: ContractDeployParams) => {
          return await this.contractDeployTool.deployContract(params);
        },
      } as any,
      {
        name: 'estimate_deploy_fee',
        description: 'Estimate the fee for deploying a smart contract',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the deployer wallet',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract to deploy',
            },
            codeBody: {
              type: 'string',
              description: 'Clarity code of the contract',
            },
          },
          required: ['fromPrivateKey', 'contractName', 'codeBody'],
        },
        execute: async (params: Omit<ContractDeployParams, 'fee'>) => {
          return await this.contractDeployTool.estimateDeployFee(params);
        },
      } as any,

      // Contract call tools
      {
        name: 'call_contract',
        description: 'Call a function in a deployed smart contract',
        parameters: {
          type: 'object',
          properties: {
            fromPrivateKey: {
              type: 'string',
              description: 'Private key of the caller wallet',
            },
            contractAddress: {
              type: 'string',
              description: 'Address of the contract',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract',
            },
            functionName: {
              type: 'string',
              description: 'Name of the function to call',
            },
            functionArgs: {
              type: 'array',
              description: 'Array of function arguments (ClarityValues)',
            },
            fee: {
              type: 'string',
              description: 'Optional fee override for the transaction',
            },
            postConditions: {
              type: 'array',
              description: 'Optional post-conditions for the transaction',
            },
            validateWithAbi: {
              type: 'boolean',
              description: 'Whether to validate function call with ABI',
              default: true,
            },
          },
          required: ['fromPrivateKey', 'contractAddress', 'contractName', 'functionName', 'functionArgs'],
        },
        execute: async (params: ContractCallParams) => {
          return await this.contractCallTool.callContract(params);
        },
      } as any,
      {
        name: 'get_contract_abi',
        description: 'Get the ABI (interface) of a deployed contract',
        parameters: {
          type: 'object',
          properties: {
            contractAddress: {
              type: 'string',
              description: 'Address of the contract',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract',
            },
          },
          required: ['contractAddress', 'contractName'],
        },
        execute: async (params: { contractAddress: string; contractName: string }) => {
          return await this.contractCallTool.getContractAbi(params.contractAddress, params.contractName);
        },
      } as any,

      // Read-only contract tools
      {
        name: 'call_readonly_function',
        description: 'Call a read-only function in a smart contract (no transaction required)',
        parameters: {
          type: 'object',
          properties: {
            contractAddress: {
              type: 'string',
              description: 'Address of the contract',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract',
            },
            functionName: {
              type: 'string',
              description: 'Name of the read-only function to call',
            },
            functionArgs: {
              type: 'array',
              description: 'Array of function arguments (ClarityValues)',
            },
            senderAddress: {
              type: 'string',
              description: 'Optional sender address for context',
            },
          },
          required: ['contractAddress', 'contractName', 'functionName', 'functionArgs'],
        },
        execute: async (params: ReadOnlyCallParams) => {
          return await this.readOnlyTool.callReadOnlyFunction(params);
        },
      } as any,
      {
        name: 'get_contract_source',
        description: 'Get the source code of a deployed contract',
        parameters: {
          type: 'object',
          properties: {
            contractAddress: {
              type: 'string',
              description: 'Address of the contract',
            },
            contractName: {
              type: 'string',
              description: 'Name of the contract',
            },
          },
          required: ['contractAddress', 'contractName'],
        },
        execute: async (params: { contractAddress: string; contractName: string }) => {
          return await this.contractCallTool.getContractSource(params.contractAddress, params.contractName);
        },
      } as any,

      // Key management tools
      {
        name: 'generate_key',
        description: 'Generate a new random private/public key pair',
        parameters: {
          type: 'object',
          properties: {
            network: {
              type: 'string',
              enum: ['mainnet', 'testnet'],
              description: 'Network to generate keys for',
            },
          },
          required: ['network'],
        },
        execute: async (params: KeyGenerationParams) => {
          return await this.keyManagementTool.generateRandomKey(params);
        },
      } as any,
      {
        name: 'import_key',
        description: 'Import a private key and get corresponding public key and address',
        parameters: {
          type: 'object',
          properties: {
            privateKeyHex: {
              type: 'string',
              description: 'Private key in hex format',
            },
            network: {
              type: 'string',
              enum: ['mainnet', 'testnet'],
              description: 'Network to import key for',
            },
          },
          required: ['privateKeyHex', 'network'],
        },
        execute: async (params: KeyImportParams) => {
          return await this.keyManagementTool.importPrivateKey(params);
        },
      } as any,
      {
        name: 'validate_address',
        description: 'Validate a Stacks address format and determine its network',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Stacks address to validate',
            },
          },
          required: ['address'],
        },
        execute: async (params: { address: string }) => {
          return await this.keyManagementTool.validateAddress(params.address);
        },
      } as any,

      // Multi-signature tools
      {
        name: 'create_multisig_stx_transfer',
        description: 'Create an unsigned multi-signature STX transfer transaction',
        parameters: {
          type: 'object',
          properties: {
            recipients: {
              type: 'string',
              description: 'Recipient address',
            },
            amount: {
              type: 'string',
              description: 'Amount of STX to transfer',
            },
            memo: {
              type: 'string',
              description: 'Optional memo for the transaction',
            },
            numSignatures: {
              type: 'number',
              description: 'Number of signatures required',
            },
            publicKeys: {
              type: 'array',
              description: 'Array of public keys for multi-sig',
            },
          },
          required: ['recipients', 'amount', 'numSignatures', 'publicKeys'],
        },
        execute: async (params: MultiSigSTXTransferParams) => {
          return await this.multiSigTool.createUnsignedSTXTransfer(params);
        },
      } as any,
      {
        name: 'sign_multisig_transaction',
        description: 'Sign a multi-signature transaction with a private key',
        parameters: {
          type: 'object',
          properties: {
            transactionHex: {
              type: 'string',
              description: 'Hex-encoded transaction to sign',
            },
            privateKey: {
              type: 'string',
              description: 'Private key to sign with',
            },
          },
          required: ['transactionHex', 'privateKey'],
        },
        execute: async (params: { transactionHex: string; privateKey: string }) => {
          return await this.multiSigTool.signTransaction(params);
        },
      } as any,

      // Sponsored transaction tools
      {
        name: 'create_sponsored_stx_transfer',
        description: 'Create a sponsored STX transfer (origin pays no fee)',
        parameters: {
          type: 'object',
          properties: {
            originPrivateKey: {
              type: 'string',
              description: 'Private key of the origin (transaction creator)',
            },
            recipient: {
              type: 'string',
              description: 'Recipient address',
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
          required: ['originPrivateKey', 'recipient', 'amount'],
        },
        execute: async (params: SponsoredSTXTransferParams) => {
          return await this.sponsoredTxTool.createSponsoredSTXTransfer(params);
        },
      } as any,
      {
        name: 'sponsor_transaction',
        description: 'Sponsor a transaction by paying the fee',
        parameters: {
          type: 'object',
          properties: {
            transactionHex: {
              type: 'string',
              description: 'Hex-encoded transaction to sponsor',
            },
            sponsorPrivateKey: {
              type: 'string',
              description: 'Private key of the sponsor (fee payer)',
            },
            fee: {
              type: 'string',
              description: 'Fee amount to pay',
            },
            sponsorNonce: {
              type: 'number',
              description: 'Optional sponsor nonce override',
            },
          },
          required: ['transactionHex', 'sponsorPrivateKey', 'fee'],
        },
        execute: async (params: SponsorTransactionParams) => {
          return await this.sponsoredTxTool.sponsorTransaction(params);
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

  async swapSTXForXBTC(params: SwapParams) {
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

    return await this.swapTool.swapSTXForXBTC(swapParams);
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