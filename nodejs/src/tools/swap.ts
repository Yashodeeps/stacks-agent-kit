import { 
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  makeContractCall,
  PostCondition,
  uintCV,
  standardPrincipalCV,
  getAddressFromPrivateKey,
  serializeCV
} from '@stacks/transactions';
import { StacksNetwork, TransactionVersion } from '@stacks/network';
import { SwapParams, SwapQuote, ToolResult } from '../types/index';

// Constants for xBTC contract on testnet
const XBTC_CONTRACT_ADDRESS = 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX';
const XBTC_CONTRACT_NAME = 'token-wbtc';
const XBTC_ASSET_NAME = 'wbtc';

// Constants for Alex Swap contract on testnet
const ALEX_SWAP_CONTRACT_ADDRESS = 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE';
const ALEX_SWAP_CONTRACT_NAME = 'swap-helper-v1-03';

export class StacksSwapTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async getSwapQuote(params: SwapParams): Promise<ToolResult<SwapQuote>> {
    try {
      const { amount } = params;
      const microSTXAmount = this.parseSTX(amount);

      // Call the Alex contract to get quote
      const senderAddress = this.getAddressFromPrivateKey(params.fromPrivateKey);
      console.log('Sender address:', senderAddress);
      console.log('Network base URL:', this.network.client.baseUrl);
      
      // Convert arguments to hex format
      const args = [
        uintCV(microSTXAmount),
        standardPrincipalCV(XBTC_CONTRACT_ADDRESS),
        standardPrincipalCV(senderAddress)
      ];
      
      const requestBody = {
        sender: senderAddress,
        arguments: args.map(arg => serializeCV(arg))
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const url = `https://api.testnet.hiro.so/v2/contracts/call-read/${ALEX_SWAP_CONTRACT_ADDRESS}/${ALEX_SWAP_CONTRACT_NAME}/get-stx-to-token-out`;
      console.log('Request URL:', url);
      
      const quoteResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await quoteResponse.text();
      console.log('Response status:', quoteResponse.status);
      console.log('Response text:', responseText);

      if (!quoteResponse.ok) {
        throw new Error(`Failed to get quote: ${quoteResponse.statusText} - ${responseText}`);
      }

      const quoteData = JSON.parse(responseText);
      
      // Calculate minimum output based on slippage tolerance
      const slippageTolerance = params.slippageTolerance || 0.5;
      const expectedOutput = quoteData.expectedOutput;
      const minimumOutput = Math.floor(
        Number(expectedOutput) * (1 - slippageTolerance / 100)
      ).toString();

      return {
        success: true,
        data: {
          expectedOutput: this.formatSTX(expectedOutput),
          minimumOutput: this.formatSTX(minimumOutput),
          fee: this.formatSTX(quoteData.fee),
          priceImpact: quoteData.priceImpact,
          route: ['STX', 'xBTC'],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get swap quote',
      };
    }
  }

  async swapSTXForXBTC(params: SwapParams): Promise<ToolResult<string>> {
    try {
      const { fromPrivateKey, amount, slippageTolerance = 0.5, fee } = params;
      
      // Get quote first
      const quote = await this.getSwapQuote(params);
      if (!quote.success || !quote.data) {
        throw new Error('Failed to get swap quote');
      }

      const microSTXAmount = this.parseSTX(amount);
      const senderAddress = this.getAddressFromPrivateKey(fromPrivateKey);
      
      // Get current nonce
      const accountResponse = await fetch(
        `${this.network.client.baseUrl}/v2/accounts/${senderAddress}`
      );
      if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
      }
      const accountInfo = await accountResponse.json();
      const nonce = parseInt(accountInfo.nonce || '0');

      // Create post conditions to ensure the swap meets requirements
      const postConditions = [
        {
          type: 'stx-postcondition',
          address: senderAddress,
          condition: 'eq',
          amount: BigInt(microSTXAmount)
        }
      ] as PostCondition[];

      // Create the swap transaction
      const txOptions = {
        contractAddress: ALEX_SWAP_CONTRACT_ADDRESS,
        contractName: ALEX_SWAP_CONTRACT_NAME,
        functionName: 'swap-stx-for-xbtc',
        functionArgs: [
          uintCV(microSTXAmount),
          uintCV(this.parseSTX(quote.data.minimumOutput)),
          standardPrincipalCV(senderAddress),
          standardPrincipalCV(XBTC_CONTRACT_ADDRESS)
        ],
        senderKey: fromPrivateKey,
        validateWithAbi: true,
        network: this.network,
        postConditions,
        postConditionMode: PostConditionMode.Deny,
        anchorMode: AnchorMode.Any,
        nonce,
        fee: fee ? this.parseSTX(fee) : undefined
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
        data: 'Swap transaction submitted successfully',
        transactionId: broadcastResponse.txid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Swap failed',
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
    // Use testnet for now since we're testing
    return getAddressFromPrivateKey(privateKey, "testnet");
  }
}
