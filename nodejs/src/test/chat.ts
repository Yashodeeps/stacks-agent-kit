import { config } from "dotenv";
import { createStacksWalletAgent } from "../index";
import { ConversationalState } from "../agents/agent";
import { run } from "node:test";

config();

// Example demonstrating the unified agent with both traditional and conversational features
async function unifiedAgentExample() {
  console.log("🤖 Unified Stacks Agent Kit - Full Feature Example\n");

  // Create an agent with both traditional and conversational AI configuration
  const agentConfig = {
    privateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK as "testnet" | "mainnet",
    model: "gpt-4",
    conversationalModel: "gpt-4", // Can use different model for conversations
    openAiApiKey: process.env.OPENAI_API_KEY,
    enableConversational: true, // Enable conversational features
    // anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };

  const testAddress = process.env.STACKS_WALLET_A_ADDRESS;
  const recipientAddress = process.env.STACKS_WALLET_B_ADDRESS || testAddress;

  if (!testAddress) {
    throw new Error(
      "STACKS_WALLET_A_ADDRESS environment variable is required for testing"
    );
  }

  const agent = await createStacksWalletAgent(agentConfig);
  await agent.init();

  console.log("✅ Unified Stacks agent created successfully");
  console.log(
    `🔧 Conversational features enabled: ${agent.isConversationalEnabled()}\n`
  );

  try {
    // PART 1: Traditional Tool Matching (works with or without conversational features)
    console.log("=".repeat(60));
    console.log("PART 1: TRADITIONAL TOOL MATCHING");
    console.log("=".repeat(60) + "\n");

    // Example 1: Simple balance query using traditional method
    console.log("1️⃣ Traditional balance query...");
    const toolMatch1 = await agent.matchPromptToTools(
      `What is the balance of wallet address ${testAddress}?`
    );

    console.log(
      "Matched tools:",
      toolMatch1.tools.map((t) => t.name)
    );
    console.log("Extracted parameters:", toolMatch1.parameters);

    // Execute the matched tools
    for (const tool of toolMatch1.tools) {
      const result = await tool.execute(toolMatch1.parameters);
      console.log(`Result from ${tool.name}:`, result);
    }
    console.log();

    // Example 2: Transfer with memo using traditional method
    console.log("2️⃣ Traditional transfer matching...");
    const toolMatch2 = await agent.matchPromptToTools(
      `Send 0.001 STX to ${recipientAddress} with memo "Test payment"`
    );

    console.log(
      "Matched tools:",
      toolMatch2.tools.map((t) => t.name)
    );
    console.log("Extracted parameters:", toolMatch2.parameters);
    console.log();

    // Example 3: Complex multi-tool query using traditional method
    console.log("3️⃣ Traditional multi-tool matching...");
    const toolMatch3 = await agent.matchPromptToTools(
      `Check the balance of ${testAddress} and estimate the fee to transfer 1 STX to ${recipientAddress}`
    );

    console.log(
      "Matched tools:",
      toolMatch3.tools.map((t) => t.name)
    );
    console.log("Extracted parameters:", toolMatch3.parameters);
    console.log();

    // PART 2: Conversational Features (only if enabled)
    if (agent.isConversationalEnabled()) {
      console.log("=".repeat(60));
      console.log("PART 2: CONVERSATIONAL FEATURES");
      console.log("=".repeat(60) + "\n");

      // Example 4: Simple conversational query
      console.log("4️⃣ Simple conversational balance query...");
      const response1 = await agent.simpleChat(
        `What's the balance of address ${testAddress}?`
      );
      console.log("Agent response:", response1);
      console.log();

      // Example 5: Multi-turn conversation
      console.log("5️⃣ Multi-turn conversation...");
      let chatState: ConversationalState | undefined;

      // First message
      const turn1 = await agent.chat(
        "I want to check my wallet balance and maybe transfer some tokens"
      );
      console.log("Agent:", turn1.response);
      chatState = turn1.state;

      // Second message - providing address
      const turn2 = await agent.continueChat(
        `My address is ${testAddress}`,
        chatState
      );
      console.log("Agent:", turn2.response);
      chatState = turn2.state;

      // Third message - asking about transfer
      const turn3 = await agent.continueChat(
        `Great! Now I want to transfer 0.001 STX to ${recipientAddress}`,
        chatState
      );
      console.log("Agent:", turn3.response);
      chatState = turn3.state;

      // Fourth message - providing private key (if needed)
      if (process.env.STACKS_WALLET_A_PRIVATE_KEY) {
        const turn4 = await agent.continueChat(
          "Please proceed with the transfer using my configured private key",
          chatState
        );
        console.log("Agent:", turn4.response);
      }
      console.log();

      // Example 6: Different conversation styles
      console.log("6️⃣ Different conversation styles...");
      const conversationStyles = [
        "Hey, what's my balance?",
        "Could you please check the STX balance for my wallet?",
        "I need to know how much STX I have in my account",
        "Balance check please!",
      ];

      for (let i = 0; i < conversationStyles.length; i++) {
        console.log(`   Style ${i + 1}: "${conversationStyles[i]}"`);
        try {
          const response = await agent.simpleChat(
            conversationStyles[i] + ` Address: ${testAddress}`
          );
          console.log(`   Response: ${response.substring(0, 100)}...`);
        } catch (error) {
          console.log(
            `   Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
      console.log();

      // Example 7: Help and guidance
      console.log("7️⃣ Help and guidance conversation...");
      const helpResponse = await agent.simpleChat(
        "I'm new to Stacks. Can you explain what you can help me with?"
      );
      console.log("Help response:", helpResponse);
      console.log();

      // Example 8: Error handling in conversation
      console.log("8️⃣ Error handling in conversation...");
      const errorResponse = await agent.simpleChat(
        "Transfer 1000000 STX to an invalid address"
      );
      console.log("Error handling response:", errorResponse);
      console.log();
    } else {
      console.log(
        "⚠️  Conversational features are not enabled. Skipping conversational examples.\n"
      );
    }

    // PART 3: Mixed Usage Patterns
    console.log("=".repeat(60));
    console.log("PART 3: MIXED USAGE PATTERNS");
    console.log("=".repeat(60) + "\n");

    // Example 9: Compare traditional vs conversational for same query
    console.log("9️⃣ Comparing traditional vs conversational approaches...");

    const query = `What's the balance and recent transactions for ${testAddress}?`;

    // Traditional approach
    console.log("Traditional approach:");
    const traditionalResult = await agent.matchPromptToTools(query);
    console.log(
      "- Matched tools:",
      traditionalResult.tools.map((t) => t.name)
    );
    console.log("- Parameters:", traditionalResult.parameters);

    // Conversational approach (if enabled)
    if (agent.isConversationalEnabled()) {
      console.log("Conversational approach:");
      const conversationalResult = await agent.simpleChat(query);
      console.log(
        "- Response:",
        conversationalResult.substring(0, 150) + "..."
      );
    }
    console.log();

    // Example 10: Configuration and customization
    console.log("🔟 Agent configuration and customization...");
    console.log("Current configuration:");
    console.log("- Network:", agentConfig.network);
    console.log("- Model:", agentConfig.model);
    console.log("- Conversational enabled:", agent.isConversationalEnabled());
    console.log("- Has private key:", !!agent.getInitializedKey());

    // Update system prompt example
    if (agent.isConversationalEnabled()) {
      const customPrompt = `You are a friendly Stacks blockchain assistant focused on helping users safely manage their STX tokens. 
Always prioritize security and provide clear explanations.`;

      agent.updateSystemPrompt(customPrompt);
      console.log("✅ System prompt updated");

      const customResponse = await agent.simpleChat(
        "What should I know about transferring STX?"
      );
      console.log(
        "Custom prompt response:",
        customResponse.substring(0, 200) + "..."
      );
    }
    console.log();

    console.log("🎉 Unified agent examples completed successfully!");
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Traditional tool matching: Working");
    console.log(
      `✅ Conversational features: ${
        agent.isConversationalEnabled() ? "Working" : "Disabled"
      }`
    );
    console.log("✅ Mixed usage patterns: Working");
    console.log("✅ Error handling: Working");
    console.log("✅ Configuration: Working");
  } catch (error) {
    console.error("❌ Example failed:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace available"
    );
  }
}

// Example of creating an agent without conversational features
async function traditionalOnlyExample() {
  console.log("\n" + "🔧 Traditional-Only Agent Example\n");

  const traditionalConfig = {
    privateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK as "testnet" | "mainnet",
    openAiApiKey: process.env.OPENAI_API_KEY,
    enableConversational: false, // Explicitly disable conversational features
  };

  const agent = await createStacksWalletAgent(traditionalConfig);
  await agent.init();

  console.log(`✅ Traditional-only agent created`);
  console.log(
    `🔧 Conversational features enabled: ${agent.isConversationalEnabled()}`
  );

  // This works fine
  const toolMatch = await agent.matchPromptToTools("Check my balance");
  console.log("Tool matching works:", toolMatch.tools.length > 0);

  // This will throw an error
  try {
    await agent.simpleChat("Hello");
    console.log("❌ This should not work!");
  } catch (error) {
    console.log(
      "✅ Conversational methods properly disabled:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// Run the examples
async function runAllExamples() {
  try {
    await unifiedAgentExample();
    await traditionalOnlyExample();
  } catch (error) {
    console.error("Failed to run examples:", error);
  }
}

// Auto-run if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runAllExamples().catch(console.error);
// }

runAllExamples().catch(console.error);

export { unifiedAgentExample, traditionalOnlyExample, runAllExamples };
