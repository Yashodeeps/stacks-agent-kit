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

    // PART 3: Personality Features (NEW)
    if (agent.isConversationalEnabled()) {
      console.log("=".repeat(60));
      console.log("PART 3: PERSONALITY FEATURES");
      console.log("=".repeat(60) + "\n");

      // Example 9: Default personality (no custom personality set)
      console.log("9️⃣ Default personality behavior...");
      console.log(
        "Current personality:",
        agent.getCurrentPersonality() || "Default (none set)"
      );
      const defaultResponse = await agent.simpleChat(
        "Tell me about STX transfers and fees"
      );
      console.log(
        "Default response:",
        defaultResponse.substring(0, 200) + "..."
      );
      console.log();

      // Example 10: Friendly and enthusiastic personality
      console.log("🔟 Setting friendly and enthusiastic personality...");
      const friendlyPersonality = `You are an extremely friendly and enthusiastic blockchain expert who loves helping people! 
      Use lots of emojis, exclamation points, and analogies to make complex blockchain concepts fun and easy to understand. 
      Always be encouraging and celebrate user successes, no matter how small. 
      When explaining technical concepts, use everyday analogies like comparing blockchain to a digital ledger book or transactions to sending mail.`;

      agent.updatePersonality(friendlyPersonality);
      console.log("✅ Friendly personality set!");

      const friendlyResponse1 = await agent.simpleChat(
        "Can you check my STX balance?"
      );
      console.log(
        "Friendly response 1:",
        friendlyResponse1.substring(0, 300) + "..."
      );

      const friendlyResponse2 = await agent.simpleChat(
        "How do transaction fees work?"
      );
      console.log(
        "Friendly response 2:",
        friendlyResponse2.substring(0, 300) + "..."
      );
      console.log();

      // Example 11: Professional and concise personality
      console.log("1️⃣1️⃣ Setting professional and concise personality...");
      const professionalPersonality = `You are a professional, no-nonsense blockchain consultant who provides precise, technical advice. 
      Keep responses concise and focus on facts and numbers. 
      Avoid emojis, exclamation points, or casual language. 
      Provide clear, actionable information without unnecessary explanations. 
      When users ask questions, give them exactly what they need to know in the most efficient way possible.`;

      agent.updatePersonality(professionalPersonality);
      console.log("✅ Professional personality set!");

      const professionalResponse1 = await agent.simpleChat(
        "Can you check my STX balance?"
      );
      console.log(
        "Professional response 1:",
        professionalResponse1.substring(0, 300) + "..."
      );

      const professionalResponse2 = await agent.simpleChat(
        "How do transaction fees work?"
      );
      console.log(
        "Professional response 2:",
        professionalResponse2.substring(0, 300) + "..."
      );
      console.log();

      // Example 12: Educational mentor personality
      console.log("1️⃣2️⃣ Setting educational mentor personality...");
      const mentorPersonality = `You are a patient and knowledgeable blockchain educator who takes pride in helping users learn. 
      Always explain the 'why' behind your recommendations and break down complex concepts into digestible steps. 
      Use teaching analogies and check for understanding. 
      Encourage questions and make users feel comfortable about not knowing everything. 
      Focus on building their confidence and knowledge progressively.`;

      agent.updatePersonality(mentorPersonality);
      console.log("✅ Educational mentor personality set!");

      const mentorResponse1 = await agent.simpleChat(
        "I'm confused about how blockchain transactions work"
      );
      console.log(
        "Mentor response 1:",
        mentorResponse1.substring(0, 300) + "..."
      );

      const mentorResponse2 = await agent.simpleChat(
        "Should I be worried about transaction fees?"
      );
      console.log(
        "Mentor response 2:",
        mentorResponse2.substring(0, 300) + "..."
      );
      console.log();

      // Example 13: Personality consistency across conversation
      console.log(
        "1️⃣3️⃣ Testing personality consistency across conversation..."
      );
      agent.updatePersonality(friendlyPersonality); // Back to friendly

      let personalityState: ConversationalState | undefined;

      const personalityTurn1 = await agent.chat(
        "Hi there! I'm new to Stacks blockchain."
      );
      console.log(
        "Turn 1 (Friendly):",
        personalityTurn1.response.substring(0, 200) + "..."
      );
      personalityState = personalityTurn1.state;

      const personalityTurn2 = await agent.continueChat(
        "Can you help me understand what STX tokens are?",
        personalityState
      );
      console.log(
        "Turn 2 (Still Friendly):",
        personalityTurn2.response.substring(0, 200) + "..."
      );
      personalityState = personalityTurn2.state;

      // Now change personality mid-conversation
      agent.updatePersonality(professionalPersonality);
      console.log("🔄 Changed to professional personality mid-conversation");

      const personalityTurn3 = await agent.continueChat(
        "What about transaction fees?",
        personalityState
      );
      console.log(
        "Turn 3 (Now Professional):",
        personalityTurn3.response.substring(0, 200) + "..."
      );
      console.log();

      // Example 14: Clearing personality
      console.log("1️⃣4️⃣ Clearing personality (reverting to default)...");
      agent.clearPersonality();
      console.log(
        "Current personality:",
        agent.getCurrentPersonality() || "Default (none set)"
      );

      const clearedResponse = await agent.simpleChat(
        "Tell me about STX transfers"
      );
      console.log(
        "Cleared personality response:",
        clearedResponse.substring(0, 200) + "..."
      );
      console.log();
    } else {
      console.log(
        "⚠️  Conversational features are not enabled. Skipping personality examples.\n"
      );
    }

    // PART 4: Mixed Usage Patterns
    console.log("=".repeat(60));
    console.log("PART 4: MIXED USAGE PATTERNS");
    console.log("=".repeat(60) + "\n");

    // Example 15: Compare traditional vs conversational for same query
    console.log("1️⃣5️⃣ Comparing traditional vs conversational approaches...");

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

    // Example 16: Configuration and customization
    console.log("1️⃣6️⃣ Agent configuration and customization...");
    console.log("Current configuration:");
    console.log("- Network:", agentConfig.network);
    console.log("- Model:", agentConfig.model);
    console.log("- Conversational enabled:", agent.isConversationalEnabled());
    console.log("- Has private key:", !!agent.getInitializedKey());
    console.log(
      "- Current personality:",
      agent.getCurrentPersonality() || "Default"
    );

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
    console.log(
      `✅ Personality features: ${
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

// Example of creating an agent with personality from the start
async function personalityFromStartExample() {
  console.log("\n" + "🎭 Personality-From-Start Agent Example\n");

  if (!process.env.OPENAI_API_KEY) {
    console.log(
      "⚠️ OpenAI API key required for personality features. Skipping..."
    );
    return;
  }

  const testAddress = process.env.STACKS_WALLET_A_ADDRESS;

  // Create agent with personality configured from initialization
  const personalityConfig = {
    privateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK as "testnet" | "mainnet",
    openAiApiKey: process.env.OPENAI_API_KEY,
    enableConversational: true,
    personalityPrompt: `You are Stacksy, a cheerful and knowledgeable Stacks blockchain mascot! 🚀 
    You love helping people navigate the Stacks ecosystem and always end your messages with a fun blockchain emoji. 
    You explain things in a simple, friendly way and get excited about the potential of decentralized applications. 
    When users accomplish something, celebrate with them! 🎉`,
  };

  const personalityAgent = await createStacksWalletAgent(personalityConfig);
  await personalityAgent.init();

  console.log("✅ Personality-configured agent created!");
  console.log(
    "Initial personality:",
    personalityAgent.getCurrentPersonality()?.substring(0, 100) + "..."
  );

  // Test the personality from the start
  const greetingResponse = await personalityAgent.simpleChat(
    "Hello! I'm new to Stacks."
  );
  console.log("Greeting response:", greetingResponse);

  if (testAddress) {
    const balanceResponse = await personalityAgent.simpleChat(
      `Can you check my balance? My address is ${testAddress}`
    );
    console.log("Balance response:", balanceResponse);
  }

  console.log("✅ Personality-from-start example completed!");
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

  // Personality methods should also be unavailable
  try {
    agent.updatePersonality("Test personality");
    console.log("❌ This should not work either!");
  } catch (error) {
    console.log(
      "✅ Personality methods properly disabled:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// Showcase different personality examples
async function personalityShowcaseExample() {
  console.log("\n" + "🎨 Personality Showcase Example\n");

  if (!process.env.OPENAI_API_KEY) {
    console.log(
      "⚠️ OpenAI API key required for personality showcase. Skipping..."
    );
    return;
  }

  const testAddress = process.env.STACKS_WALLET_A_ADDRESS;

  const baseConfig = {
    privateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK as "testnet" | "mainnet",
    openAiApiKey: process.env.OPENAI_API_KEY,
    enableConversational: true,
  };

  const personalities = [
    {
      name: "The Crypto Pirate 🏴‍☠️",
      prompt: `You are a friendly crypto pirate who loves blockchain treasure! 
      Use pirate language occasionally (ahoy, matey, etc.) and refer to STX tokens as 'digital doubloons'. 
      You're adventurous and exciting but still knowledgeable about blockchain security. 
      End messages with ⚓ when appropriate.`,
    },
    {
      name: "The Blockchain Scientist 🧪",
      prompt: `You are a blockchain scientist who approaches everything with curiosity and precision. 
      You love explaining the technical details and often use scientific analogies. 
      You're methodical, thorough, and fascinated by the underlying cryptographic principles. 
      Occasionally reference experiments, molecules, or lab work in your explanations.`,
    },
    {
      name: "The Zen Master 🧘‍♂️",
      prompt: `You are a wise and calm blockchain zen master who helps users find balance in the crypto world. 
      Speak in a peaceful, mindful way and often relate blockchain concepts to life philosophy. 
      Encourage patience, mindfulness, and thoughtful decision-making. 
      Use nature analogies and remind users to stay centered.`,
    },
  ];

  const testQuery = testAddress
    ? `What's my STX balance? My address is ${testAddress}`
    : "Can you explain how STX transactions work?";

  for (const personality of personalities) {
    console.log(`\n--- ${personality.name} ---`);

    const agent = await createStacksWalletAgent({
      ...baseConfig,
      personalityPrompt: personality.prompt,
    });
    await agent.init();

    const response = await agent.simpleChat(testQuery);
    console.log(
      "Response:",
      response.substring(0, 300) + (response.length > 300 ? "..." : "")
    );
  }

  console.log("\n✅ Personality showcase completed!");
}

// Run the examples
async function runAllExamples() {
  try {
    await unifiedAgentExample();
    await personalityFromStartExample();
    await personalityShowcaseExample();
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

export {
  unifiedAgentExample,
  personalityFromStartExample,
  personalityShowcaseExample,
  traditionalOnlyExample,
  runAllExamples,
};
