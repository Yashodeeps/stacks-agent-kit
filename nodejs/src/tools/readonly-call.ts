import { 
  fetchCallReadOnlyFunction,
  ClarityValue,
  cvToString,
  cvToJSON,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { ToolResult } from '../types/index';

export interface ReadOnlyCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress?: string; // Optional sender address for context
}

export interface ReadOnlyResult {
  result: any;
  resultString: string;
  resultJSON: any;
  success: boolean;
}

export class StacksReadOnlyTool {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  async callReadOnlyFunction(params: ReadOnlyCallParams): Promise<ToolResult<ReadOnlyResult>> {
    try {
      const { 
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderAddress
      } = params;

      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network: this.network,
        senderAddress: senderAddress || 'ST000000000000000000002AMW42H', // Default sender
      };

      const result = await fetchCallReadOnlyFunction(options);
      
      // Convert the result to different formats for easier consumption
      const resultString = cvToString(result);
      const resultJSON = cvToJSON(result);

      return {
        success: true,
        data: {
          result,
          resultString,
          resultJSON,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Read-only function call failed',
      };
    }
  }

  async getContractInfo(contractAddress: string, contractName: string): Promise<ToolResult<any>> {
    try {
      const infoResponse = await fetch(
        `${this.network.client.baseUrl}/v2/contracts/interface/${contractAddress}/${contractName}`
      );
      
      if (!infoResponse.ok) {
        throw new Error(`Failed to fetch contract info: ${infoResponse.statusText}`);
      }

      const info = await infoResponse.json();
      
      return {
        success: true,
        data: info,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract info',
      };
    }
  }

  async getContractStatus(contractAddress: string, contractName: string): Promise<ToolResult<any>> {
    try {
      const statusResponse = await fetch(
        `${this.network.client.baseUrl}/v2/contracts/status/${contractAddress}/${contractName}`
      );
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to fetch contract status: ${statusResponse.statusText}`);
      }

      const status = await statusResponse.json();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract status',
      };
    }
  }

  async getContractEvents(
    contractAddress: string, 
    contractName: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<ToolResult<any[]>> {
    try {
      const eventsResponse = await fetch(
        `${this.network.client.baseUrl}/extended/v1/contract/${contractAddress}.${contractName}/events?limit=${limit}&offset=${offset}`
      );
      
      if (!eventsResponse.ok) {
        throw new Error(`Failed to fetch contract events: ${eventsResponse.statusText}`);
      }

      const eventsData = await eventsResponse.json();
      
      return {
        success: true,
        data: eventsData.results || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contract events',
      };
    }
  }

  async getDataVar(
    contractAddress: string, 
    contractName: string, 
    varName: string,
    proof?: number
  ): Promise<ToolResult<ReadOnlyResult>> {
    try {
      let url = `${this.network.client.baseUrl}/v2/data_var/${contractAddress}/${contractName}/${varName}`;
      if (proof !== undefined) {
        url += `?proof=${proof}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data variable: ${response.statusText}`);
      }

      const data = await response.json();
      
      // The data variable value is in the 'data' field
      const resultString = data.data || '';
      
      return {
        success: true,
        data: {
          result: data,
          resultString,
          resultJSON: data,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get data variable',
      };
    }
  }

  async getMapEntry(
    contractAddress: string, 
    contractName: string, 
    mapName: string,
    key: ClarityValue,
    proof?: number
  ): Promise<ToolResult<ReadOnlyResult>> {
    try {
      let url = `${this.network.client.baseUrl}/v2/map_entry/${contractAddress}/${contractName}/${mapName}`;
      if (proof !== undefined) {
        url += `?proof=${proof}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(key),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch map entry: ${response.statusText}`);
      }

      const data = await response.json();
      
      // The map entry value is in the 'data' field
      const resultString = data.data || '';
      
      return {
        success: true,
        data: {
          result: data,
          resultString,
          resultJSON: data,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get map entry',
      };
    }
  }

  async listContractFunctions(contractAddress: string, contractName: string): Promise<ToolResult<any[]>> {
    try {
      const abi = await this.getContractInfo(contractAddress, contractName);
      
      if (!abi.success || !abi.data) {
        throw new Error('Failed to get contract ABI');
      }

      const functions = abi.data.functions || [];
      
      // Filter and format function information
      const functionList = functions.map((func: any) => ({
        name: func.name,
        access: func.access,
        args: func.args,
        outputs: func.outputs,
        description: func.description || 'No description available',
      }));

      return {
        success: true,
        data: functionList,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list contract functions',
      };
    }
  }
}
