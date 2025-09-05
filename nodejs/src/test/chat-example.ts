
import {
  ConversationalState,
  createConversationalStacksAgent,
} from "../conversation/agent.js";

class StacksChatBot {
  private agent: any;
  private sessions: Map<string, ConversationalState> = new Map();

  constructor(
    openAIApiKey: string,
    network: "mainnet" | "testnet" = "testnet"
  ) {
    this.agent = createConversationalStacksAgent({
      network,
      openAIApiKey,
      model: "gpt-4", // or 'gpt-3.5-turbo' for faster/cheaper responses
    });
  }

  // Start a new conversation session
  async startSession(sessionId: string): Promise<string> {
    const welcomeResponse = await this.agent.simpleChat(
      "Hello! I'm your Stacks blockchain assistant. How can I help you today?"
    );
    return welcomeResponse;
  }

  // Continue an existing conversation
  async chat(sessionId: string, message: string): Promise<string> {
    const existingState = this.sessions.get(sessionId);

    const result = await this.agent.chat(message, existingState);

    // Store the updated state
    this.sessions.set(sessionId, result.state);

    return result.response;
  }

  // Clear a session
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

// Example usage scenarios
async function demonstrateUsage() {
  const chatBot = new StacksChatBot(process.env.OPENAI_API_KEY || "");
  const sessionId = "user123";

  console.log("=== Starting Stacks Chat Demo ===\n");

  // Scenario 1: Check balance
  console.log(
    "User: What is the balance of ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?"
  );
  const response1 = await chatBot.chat(
    sessionId,
    "What is the balance of ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM?"
  );
  console.log("Bot:", response1);
  console.log();

  // Scenario 2: Transfer request (multi-turn)
  console.log("User: I want to transfer 5 STX to someone");
  const response2 = await chatBot.chat(
    sessionId,
    "I want to transfer 5 STX to someone"
  );
  console.log("Bot:", response2);
  console.log();

  console.log(
    "User: The recipient address is ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  );
  const response3 = await chatBot.chat(
    sessionId,
    "The recipient address is ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  );
  console.log("Bot:", response3);
  console.log();

  // Scenario 3: Fee estimation
  console.log("User: How much would it cost to send 10 STX?");
  const response4 = await chatBot.chat(
    sessionId,
    "How much would it cost to send 10 STX?"
  );
  console.log("Bot:", response4);
  console.log();

  // Scenario 4: Complex query
  console.log(
    "User: Can you get the transaction history for ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM with the last 5 transactions?"
  );
  const response5 = await chatBot.chat(
    sessionId,
    "Can you get the transaction history for ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM with the last 5 transactions?"
  );
  console.log("Bot:", response5);
  console.log();
}

demonstrateUsage().catch((error) => {
  console.error("Error during chat demonstration:", error);
});
