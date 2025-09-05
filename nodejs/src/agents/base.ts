import { StateGraph, END } from '@langchain/langgraph';
import { StacksNetwork, STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { AgentConfig, ToolResult } from '../types/index';

export abstract class StacksAgent {
  protected network: StacksNetwork;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.network = this.createNetwork(config.network);
  }

  private createNetwork(networkConfig: AgentConfig['network']): StacksNetwork {
    if (networkConfig.network === 'mainnet') {
      return STACKS_MAINNET;
    } else {
      return STACKS_TESTNET;
    }
  }

  protected createGraph() {
    const graph = new StateGraph({
      channels: {
        state: {
          value: (x: any, y: any) => y ?? x,
          default: () => ({}),
        },
      },
    } as any);

    return graph;
  }

  protected async executeTool<T>(
    toolFunction: () => Promise<T>,
    toolName: string
  ): Promise<ToolResult<T>> {
    try {
      const data = await toolFunction();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`Error in ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  protected formatSTX(microSTX: string): string {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, '0')}`;
  }

  protected parseSTX(stx: string): string {
    const [whole, decimal = '0'] = stx.split('.');
    const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6);
    return `${whole}${paddedDecimal}`;
  }

  abstract getTools(): any[];
}
