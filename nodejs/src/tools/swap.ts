import { 
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  FungibleConditionCode,
  makeContractCall,
  PostCondition,
  uintCV,
  standardPrincipalCV
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { SwapParams, SwapQuote, ToolResult } from '../types/index';

// Constants for sBTC contract
const SBTC_CONTRACT_ADDRESS = 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR';
const SBTC_CONTRACT_NAME = 'wrapped-bitcoin';
const SBTC_ASSET_NAME = 'wrapped-bitcoin';

// Constants for Alex Swap contract
const ALEX_SWAP_CONTRACT_ADDRESS = 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9';
const ALEX_SWAP_CONTRACT_NAME = 'swap-v1';

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
      const quoteResponse = await fetch(
        `${this.network.client.baseUrl}/v2/contracts/call-read/${ALEX_SWAP_CONTRACT_ADDRESS}/${ALEX_SWAP_CONTRACT_NAME}/get-swap-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: this.getAddressFromPrivateKey(params.fromPrivateKey),
            arguments: [
              uintCV(microSTXAmount).toString(),
            ],
          }),
        }
      );

      if (!quoteResponse.ok) {
        throw new Error(`Failed to get quote: ${quoteResponse.statusText}`);
      }

      const quoteData = await quoteResponse.json();
      
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
          route: ['STX', 'sBTC'],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get swap quote',
      };
    }
  }

  async swapSTXForSBTC(params: SwapParams): Promise<ToolResult<string>> {
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
        functionName: 'swap-stx-for-sbtc',
        functionArgs: [
          uintCV(microSTXAmount),
          uintCV(this.parseSTX(quote.data.minimumOutput)),
          standardPrincipalCV(senderAddress)
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
    // This is a simplified version - in production you'd use proper key derivation
    // For now, we'll assume the private key is provided with the address
    // In a real implementation, you'd derive the address from the private key
    return 'SP000000000000000000002Q6VF78'; // Placeholder address
  }
}
