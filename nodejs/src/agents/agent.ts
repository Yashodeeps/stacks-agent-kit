import { StateGraph, END } from '@langchain/langgraph';
import { StacksNetwork, STACKS_TESTNET, STACKS_MAINNET, createNetwork } from '@stacks/network';
import { AgentConfig, ToolResult, PrivateKeyInfo } from '../types/index';
import { StacksUtils } from '../utils/index';

export abstract class StacksAgent {
  protected network: StacksNetwork;
  protected config: AgentConfig;
  protected initializedKey?: PrivateKeyInfo;
  protected aiClient?: any;

  constructor(config: AgentConfig) {
    this.config = config;
    this.network = this.createNetwork(config.network);
    
    // Initialize private key if provided
    if (config.privateKey) {
      this.initializePrivateKey(config.privateKey);
    }
  }

  async init(): Promise<void> {
    // Initialize AI client if API keys are provided
    await this.initializeAIClient();
  }

  private createNetwork(networkConfig: AgentConfig['network']): StacksNetwork {
    // If custom URLs are provided, create a custom network
    if (networkConfig.coreApiUrl || networkConfig.broadcastApiUrl) {
      // Use coreApiUrl as the primary baseUrl, fallback to broadcastApiUrl if coreApiUrl not provided
      const baseUrl = networkConfig.coreApiUrl || networkConfig.broadcastApiUrl;
      
      return createNetwork({
        network: networkConfig.network,
        client: {
          baseUrl: baseUrl!
        }
      });
    }
    
    // Use default networks if no custom URLs provided
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

  private initializePrivateKey(privateKey: string): void {
    try {
      this.initializedKey = StacksUtils.initializePrivateKey({
        privateKey,
        network: this.config.network.network,
      });
    } catch (error) {
      console.warn(`Failed to initialize private key: ${error}`);
    }
  }

  private async initializeAIClient(): Promise<void> {
    try {
      if (this.config.openAiApiKey) {
        // Dynamically import OpenAI to avoid issues if not installed
        const { OpenAI } = await import('openai');
        this.aiClient = new OpenAI({
          apiKey: this.config.openAiApiKey,
        });
      } else if (this.config.anthropicApiKey) {
        // Dynamically import Anthropic to avoid issues if not installed
        const { Anthropic } = await import('@anthropic-ai/sdk');
        this.aiClient = new Anthropic({
          apiKey: this.config.anthropicApiKey,
        });
      }
    } catch (error) {
      console.warn(`Failed to initialize AI client: ${error}`);
    }
  }

  async matchPromptToTools(prompt: string): Promise<{ tools: any[], parameters: any, error?: string }> {
    if (!this.aiClient) {
      console.warn('No AI client initialized. Please provide either OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables.');
      return { 
        tools: [], 
        parameters: {},
        error: 'No AI client available. Please configure an AI provider (OpenAI or Anthropic) to use this feature.'
      };
    }

    try {
      const tools = this.getTools();
      const toolDescriptions = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));

      const systemPrompt = `You are a helpful assistant that matches user prompts to appropriate Stacks blockchain tools and extracts parameters.

      Available tools: ${JSON.stringify(toolDescriptions, null, 2)}

      For the given user prompt, you need to:
      1. Identify which tools are most relevant
      2. Extract all parameters needed for those tools from the prompt

      Return a JSON object with this structure:
      {
        "tools": ["tool_name_1", "tool_name_2"],
        "parameters": {
          "address": "extracted_address",
          "amount": "extracted_amount",
          "toAddress": "extracted_to_address",
          "memo": "extracted_memo",
          "includeTransactions": true/false,
          "limit": number
        }
      }

      Only include parameters that are mentioned in the prompt. If a parameter is not mentioned, don't include it in the parameters object.`;

      let response;
      if (this.config.openAiApiKey) {
        response = await this.aiClient.chat.completions.create({
          model: this.config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        });
        const result = JSON.parse(response.choices[0].message.content || '{"tools": [], "parameters": {}}');
        return {
          tools: tools.filter(tool => result.tools.includes(tool.name)),
          parameters: result.parameters || {}
        };
      } else if (this.config.anthropicApiKey) {
        response = await this.aiClient.messages.create({
          model: this.config.model || 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nUser prompt: ${prompt}` }
          ],
        });
        const result = JSON.parse(response.content[0].text || '{"tools": [], "parameters": {}}');
        return {
          tools: tools.filter(tool => result.tools.includes(tool.name)),
          parameters: result.parameters || {}
        };
      }
    } catch (error) {
      console.error('Error matching prompt to tools:', error);
      return { tools: this.getTools(), parameters: {} };
    }

    // If no AI client was used (neither OpenAI nor Anthropic), return default tools
    return { tools: this.getTools(), parameters: {} };
  }

  getInitializedKey(): PrivateKeyInfo | undefined {
    return this.initializedKey;
  }

  abstract getTools(): any[];
}
