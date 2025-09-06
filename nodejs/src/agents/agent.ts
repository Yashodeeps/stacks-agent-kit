//@ts-nocheck

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  StacksNetwork,
  STACKS_TESTNET,
  STACKS_MAINNET,
  createNetwork,
} from "@stacks/network";
import { AgentConfig, ToolResult, PrivateKeyInfo } from "../types/index";
import { StacksUtils } from "../utils/index";

// Extended state interface for conversational agent
export interface ConversationalState {
  messages: (HumanMessage | AIMessage | SystemMessage | ToolMessage)[];
  currentTool?: string;
  toolResults?: any;
  userAddress?: string;
  context?: Record<string, any>;
}

export interface ConversationalConfig extends AgentConfig {
  enableConversational?: boolean;
  conversationalModel?: string;
  systemPrompt?: string;
  personalityPrompt?: string;
}

export abstract class StacksAgent {
  public network: StacksNetwork;
  protected config: ConversationalConfig;
  protected initializedKey?: PrivateKeyInfo;
  protected aiClient?: any;
  protected llm?: ChatOpenAI;
  protected systemPrompt: string;
  protected personalityPrompt?: string;
  protected conversationalEnabled?: boolean;

  constructor(config: ConversationalConfig) {
    this.config = config;
    this.network = this.createNetwork(config.network);
    this.conversationalEnabled = config.enableConversational ?? true;

    this.personalityPrompt = config.personalityPrompt;

    // Set default system prompt (now incorporates personality if provided)
    this.systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt();

    // Initialize private key if provided
    if (config.privateKey) {
      this.initializePrivateKey(config.privateKey);
    }
  }

  async init(): Promise<void> {
    // Initialize AI client if API keys are provided
    await this.initializeAIClient();

    // Initialize conversational LLM if enabled and OpenAI key is available
    if (this.conversationalEnabled && this.config.openAiApiKey) {
      this.initializeConversationalLLM();
    }
  }

  private createNetwork(networkConfig: AgentConfig["network"]): StacksNetwork {
    // If custom URLs are provided, create a custom network
    if (networkConfig.coreApiUrl || networkConfig.broadcastApiUrl) {
      const baseUrl = networkConfig.coreApiUrl || networkConfig.broadcastApiUrl;

      return createNetwork({
        network: networkConfig.network,
        client: {
          baseUrl: baseUrl!,
        },
      });
    }

    // Use default networks if no custom URLs provided
    if (networkConfig.network === "mainnet") {
      return STACKS_MAINNET;
    } else {
      return STACKS_TESTNET;
    }
  }

  private initializeConversationalLLM(): void {
    if (!this.config.openAiApiKey) {
      console.warn("OpenAI API key required for conversational features");
      return;
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.openAiApiKey,
      modelName:
        this.config.conversationalModel || this.config.model || "gpt-4",
      temperature: 0.1,
    });
  }

  private getDefaultSystemPrompt(): string {
    const basePrompt = `You are a helpful Stacks blockchain assistant. You can help users with:
1. Querying wallet information (balance, transactions, nonce)
2. Transferring STX tokens
3. Estimating transfer fees
4. Validating transfers

Always be clear about what information you need and explain the steps you're taking.
When handling private keys, remind users to keep them secure and never share them.
For transfers, always validate before executing.

Available tools: ${this.getTools()
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join(", ")}

Respond conversationally and ask for clarification when needed.`;

    // Incorporate personality prompt if provided
    if (this.personalityPrompt) {
      return `${basePrompt}

PERSONALITY AND BEHAVIOR:
${this.personalityPrompt}

Remember to maintain this personality while helping users with Stacks blockchain operations.`;
    }

    return basePrompt;
  }

  // New method to get the complete system prompt including personality
  private getCompleteSystemPrompt(): string {
    return this.systemPrompt;
  }

  // New method to update personality prompt at runtime
  updatePersonality(personalityPrompt: string): void {
    this.personalityPrompt = personalityPrompt;
    // Regenerate system prompt with new personality
    this.systemPrompt = this.getDefaultSystemPrompt();
  }

  // New method to clear personality (revert to default)
  clearPersonality(): void {
    this.personalityPrompt = undefined;
    this.systemPrompt = this.getDefaultSystemPrompt();
  }

  // New method to get current personality
  getCurrentPersonality(): string | undefined {
    return this.personalityPrompt;
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

  // Create the conversational graph
  private createConversationalGraph() {
    const graph = new StateGraph<ConversationalState>({
      channels: {
        messages: {
          value: (x: any[], y: any[]) => x.concat(y || []),
          default: () => [],
        },
        currentTool: {
          value: (x: any, y: any) => y ?? x,
          default: () => undefined,
        },
        toolResults: {
          value: (x: any, y: any) => y ?? x,
          default: () => undefined,
        },
        userAddress: {
          value: (x: any, y: any) => y ?? x,
          default: () => undefined,
        },
        context: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
      },
    } as any);

    // Add nodes
    graph.addNode("analyze_message", this.analyzeMessage.bind(this));
    graph.addNode("execute_tool", this.executeToolNode.bind(this));
    graph.addNode("respond", this.respond.bind(this));

    // Add edges
    graph.addEdge(START, "analyze_message");
    graph.addConditionalEdges(
      "analyze_message",
      this.shouldUseTool.bind(this),
      {
        tool: "execute_tool",
        respond: "respond",
      }
    );
    graph.addEdge("execute_tool", "respond");
    graph.addEdge("respond", END);

    return graph.compile();
  }

  // Analyze the user's message and determine intent
  private async analyzeMessage(
    state: ConversationalState
  ): Promise<Partial<ConversationalState>> {
    if (!this.llm) {
      throw new Error(
        "Conversational LLM not initialized. Please ensure enableConversational is true and OpenAI API key is provided."
      );
    }

    // Use complete system prompt including personality
    const messages = [
      new SystemMessage(this.getCompleteSystemPrompt()),
      ...state.messages,
    ];

    const analysisPrompt = `Analyze the user's message and determine:
1. What tool (if any) should be used?
2. What parameters are needed?
3. Is there missing information?

Available tools: ${this.getTools()
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join(", ")}

Respond with a JSON object containing:
{
  "needsTool": boolean,
  "toolName": string or null,
  "parameters": object or null,
  "missingInfo": string[] or null,
  "intent": string
}`;

    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage instanceof HumanMessage) {
      const analysisMessage = new HumanMessage(
        `${analysisPrompt}\n\nUser message: "${lastMessage.content}"`
      );

      try {
        const response = await this.llm.invoke([...messages, analysisMessage]);
        const analysis = JSON.parse(response.content as string);

        return {
          currentTool: analysis.needsTool ? analysis.toolName : undefined,
          context: {
            ...state.context,
            analysis,
            parameters: analysis.parameters,
          },
        };
      } catch (error) {
        console.error("Error analyzing message:", error);
        return {
          context: {
            ...state.context,
            analysis: { needsTool: false, intent: "unclear" },
          },
        };
      }
    }

    return {};
  }

  // Determine if we should use a tool
  private shouldUseTool(state: ConversationalState): string {
    const analysis = state.context?.analysis;
    if (
      analysis?.needsTool &&
      analysis.toolName &&
      !analysis.missingInfo?.length
    ) {
      return "tool";
    }
    return "respond";
  }

  // Execute the appropriate tool
  private async executeToolNode(
    state: ConversationalState
  ): Promise<Partial<ConversationalState>> {
    const toolName = state.currentTool;
    const parameters = state.context?.analysis?.parameters;

    if (!toolName || !parameters) {
      return {
        toolResults: { error: "No tool or parameters specified" },
      };
    }

    try {
      // Find the tool and execute it
      const tools = this.getTools();
      const tool = tools.find((t) => t.name === toolName);

      if (!tool) {
        return {
          toolResults: { success: false, error: `Unknown tool: ${toolName}` },
        };
      }

      // Execute the tool function with parameters
      const result = await this.executeTool(
        () => tool.execute(parameters),
        toolName
      );

      return {
        toolResults: result,
        context: {
          ...state.context,
          lastToolUsed: toolName,
          lastToolParams: parameters,
        },
      };
    } catch (error) {
      return {
        toolResults: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // Generate response to user
  private async respond(
    state: ConversationalState
  ): Promise<Partial<ConversationalState>> {
    if (!this.llm) {
      throw new Error("Conversational LLM not initialized");
    }

    const analysis = state.context?.analysis;
    const toolResults = state.toolResults;

    let responsePrompt = `Based on the user's message and any tool results, provide a helpful response.
Keep it conversational and clear. If there were errors, explain them helpfully.
If information is missing, ask for it politely.`;

    if (analysis?.missingInfo?.length) {
      responsePrompt += `\n\nMissing information needed: ${analysis.missingInfo.join(
        ", "
      )}`;
    }

    if (toolResults) {
      responsePrompt += `\n\nTool results: ${JSON.stringify(
        toolResults,
        null,
        2
      )}`;
    }

    const messages = [
      new SystemMessage(this.getCompleteSystemPrompt()),
      ...state.messages,
      new HumanMessage(responsePrompt),
    ];

    try {
      const response = await this.llm.invoke(messages);
      const aiMessage = new AIMessage(response.content as string);

      return {
        messages: [aiMessage],
        currentTool: undefined,
        toolResults: undefined,
      };
    } catch (error) {
      const errorMessage = new AIMessage(
        "Sorry, I encountered an error while processing your request. Please try again."
      );
      return {
        messages: [errorMessage],
        currentTool: undefined,
        toolResults: undefined,
      };
    }
  }

  // Main chat method - only available when conversational is enabled
  async chat(
    message: string,
    sessionState?: Partial<ConversationalState>
  ): Promise<{
    response: string;
    state: ConversationalState;
  }> {
    if (!this.conversationalEnabled || !this.llm) {
      throw new Error(
        "Conversational features not enabled. Set enableConversational to true and provide OpenAI API key."
      );
    }

    const graph = this.createConversationalGraph();

    const initialState: ConversationalState = {
      messages: [...(sessionState?.messages || []), new HumanMessage(message)],
      userAddress: sessionState?.userAddress,
      context: sessionState?.context || {},
    };

    try {
      const result = await graph.invoke(initialState);
      const lastMessage = result.messages[result.messages.length - 1];

      return {
        response: lastMessage.content as string,
        state: result,
      };
    } catch (error) {
      console.error("Chat error:", error);
      return {
        response: "I apologize, but I encountered an error. Please try again.",
        state: initialState,
      };
    }
  }

  // Convenience method for simple queries
  async simpleChat(message: string): Promise<string> {
    if (!this.conversationalEnabled) {
      throw new Error("Conversational features not enabled");
    }

    const result = await this.chat(message);
    return result.response;
  }

  // Method to continue a conversation
  async continueChat(
    message: string,
    previousState: ConversationalState
  ): Promise<{
    response: string;
    state: ConversationalState;
  }> {
    if (!this.conversationalEnabled) {
      throw new Error("Conversational features not enabled");
    }

    return await this.chat(message, previousState);
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
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  protected formatSTX(microSTX: string): string {
    const stx = BigInt(microSTX) / BigInt(1000000);
    const remainder = BigInt(microSTX) % BigInt(1000000);
    return `${stx}.${remainder.toString().padStart(6, "0")}`;
  }

  protected parseSTX(stx: string): string {
    const [whole, decimal = "0"] = stx.split(".");
    const paddedDecimal = decimal.padEnd(6, "0").slice(0, 6);
    return `${whole}${paddedDecimal}`;
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
        const { OpenAI } = await import("openai");
        this.aiClient = new OpenAI({
          apiKey: this.config.openAiApiKey,
        });
      } else if (this.config.anthropicApiKey) {
        // Dynamically import Anthropic to avoid issues if not installed
        const { Anthropic } = await import("@anthropic-ai/sdk");
        this.aiClient = new Anthropic({
          apiKey: this.config.anthropicApiKey,
        });
      }
    } catch (error) {
      console.warn(`Failed to initialize AI client: ${error}`);
    }
  }

  async matchPromptToTools(
    prompt: string
  ): Promise<{ tools: any[]; parameters: any; error?: string }> {
    if (!this.aiClient) {
      console.warn(
        "No AI client initialized. Please provide either OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables."
      );
      return {
        tools: [],
        parameters: {},
        error:
          "No AI client available. Please configure an AI provider (OpenAI or Anthropic) to use this feature.",
      };
    }

    try {
      const tools = this.getTools();
      const toolDescriptions = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }));

      const systemPrompt = `You are a helpful assistant that matches user prompts to appropriate Stacks blockchain tools and extracts parameters.

      ${
        this.personalityPrompt ? `PERSONALITY: ${this.personalityPrompt}\n` : ""
      }

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
          model: this.config.model || "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        });
        const result = JSON.parse(
          response.choices[0].message.content ||
            '{"tools": [], "parameters": {}}'
        );
        return {
          tools: tools.filter((tool) => result.tools.includes(tool.name)),
          parameters: result.parameters || {},
        };
      } else if (this.config.anthropicApiKey) {
        response = await this.aiClient.messages.create({
          model: this.config.model || "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\nUser prompt: ${prompt}`,
            },
          ],
        });
        const result = JSON.parse(
          response.content[0].text || '{"tools": [], "parameters": {}}'
        );
        return {
          tools: tools.filter((tool) => result.tools.includes(tool.name)),
          parameters: result.parameters || {},
        };
      }
    } catch (error) {
      console.error("Error matching prompt to tools:", error);
      return { tools: this.getTools(), parameters: {} };
    }

    // If no AI client was used (neither OpenAI nor Anthropic), return default tools
    return { tools: this.getTools(), parameters: {} };
  }

  getInitializedKey(): PrivateKeyInfo | undefined {
    return this.initializedKey;
  }

  // Check if conversational features are enabled
  isConversationalEnabled(): boolean {
    return this.conversationalEnabled && !!this.llm;
  }

  updateSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  abstract getTools(): any[];
}
