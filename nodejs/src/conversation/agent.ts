//@ts-nocheck

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { AgentConfig } from "../types/index";
import { StacksWalletAgent } from "../agents/index";

// Extended state interface for conversational agent
export interface ConversationalState {
  messages: (HumanMessage | AIMessage | SystemMessage | ToolMessage)[];
  currentTool?: string;
  toolResults?: any;
  userAddress?: string;
  context?: Record<string, any>;
}

export class ConversationalStacksAgent extends StacksWalletAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;

  constructor(config: AgentConfig & { openAIApiKey: string; model?: string }) {
    super(config);

    this.llm = new ChatOpenAI({
      openAIApiKey: config.openAIApiKey,
      modelName: config.model || "gpt-4",
      temperature: 0.1,
    });

    this.systemPrompt = `You are a helpful Stacks blockchain assistant. You can help users with:
1. Querying wallet information (balance, transactions, nonce)
2. Transferring STX tokens
3. Estimating transfer fees
4. Validating transfers

Always be clear about what information you need and explain the steps you're taking.
When handling private keys, remind users to keep them secure and never share them.
For transfers, always validate before executing.

Available tools:
- query_wallet: Get wallet info including balance and transactions
- get_balance: Get STX balance for an address  
- transfer_stx: Transfer STX tokens (requires private key)
- estimate_transfer_fee: Estimate fee for a transfer
- validate_transfer: Check if a transfer is valid

Respond conversationally and ask for clarification when needed.`;
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
    });

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
    const messages = [new SystemMessage(this.systemPrompt), ...state.messages];

    const analysisPrompt = `Analyze the user's message and determine:
1. What tool (if any) should be used?
2. What parameters are needed?
3. Is there missing information?

Available tools: query_wallet, get_balance, transfer_stx, estimate_transfer_fee, validate_transfer

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
      let result;
      switch (toolName) {
        case "query_wallet":
          result = await this.queryWallet(parameters);
          break;
        case "get_balance":
          result = await this.getBalance(parameters);
          break;
        case "transfer_stx":
          result = await this.transferSTX(parameters);
          break;
        case "estimate_transfer_fee":
          result = await this.estimateTransferFee(parameters);
          break;
        case "validate_transfer":
          result = await this.validateTransfer(parameters);
          break;
        default:
          result = { success: false, error: `Unknown tool: ${toolName}` };
      }

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
      new SystemMessage(this.systemPrompt),
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

  // Main chat method
  async chat(
    message: string,
    sessionState?: Partial<ConversationalState>
  ): Promise<{
    response: string;
    state: ConversationalState;
  }> {
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
    return await this.chat(message, previousState);
  }
}

// Updated factory function
export function createConversationalStacksAgent(config: {
  network: "mainnet" | "testnet";
  openAIApiKey: string;
  model?: string;
  coreApiUrl?: string;
  broadcastApiUrl?: string;
  defaultFee?: string;
}) {
  return new ConversationalStacksAgent({
    network: {
      network: config.network,
      coreApiUrl: config.coreApiUrl,
      broadcastApiUrl: config.broadcastApiUrl,
    },
    defaultFee: config.defaultFee,
    openAIApiKey: config.openAIApiKey,
    model: config.model,
  });
}

// Example usage
export async function exampleUsage() {
  const agent = createConversationalStacksAgent({
    network: "testnet",
    openAIApiKey: "your-openai-api-key",
    model: "gpt-4",
  });

  // Simple single message
  const response1 = await agent.simpleChat(
    "What's the balance of address ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?"
  );
  console.log("Response:", response1);

  // Conversational flow
  let chatState: ConversationalState | undefined;

  const result1 = await agent.chat("I want to transfer some STX tokens");
  console.log("Agent:", result1.response);
  chatState = result1.state;

  const result2 = await agent.continueChat(
    "I want to send 5 STX from my address to ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    chatState
  );
  console.log("Agent:", result2.response);
  chatState = result2.state;

  // The agent will ask for the private key if needed
  const result3 = await agent.continueChat(
    "My private key is abcd1234...",
    chatState
  );
  console.log("Agent:", result3.response);
}
