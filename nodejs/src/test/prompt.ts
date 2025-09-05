import { config } from 'dotenv';
import { createStacksWalletAgent } from '../index';

config();

// Example demonstrating the improved AI-powered agent with automatic parameter extraction
async function promptExample() {
  console.log('🤖 Stacks Agent Kit - Improved AI Agent Example\n');

  // Create an agent with AI configuration
  const agentConfig = {
    privateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK as 'testnet' | 'mainnet',
    model: 'gpt-4o',
    openAiApiKey: process.env.OPENAI_API_KEY,
    // anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };

  const testAddress = process.env.STACKS_WALLET_A_ADDRESS;

  if (!testAddress) {
    throw new Error('STACKS_WALLET_ADDRESS environment variable is required for testing');
  }

  const agent = await createStacksWalletAgent(agentConfig);

  console.log('✅  Stacks agent created successfully\n');

  try {
    // Example 1: Simple balance query (AI extracts address automatically)
    console.log('1️⃣ Simple balance query...');
    const balanceResult = await agent.executePrompt(
      `What is the balance of wallet address  ${testAddress}?`
    );
    console.log('Balance result:', balanceResult);
    console.log();

    // Example 2: Transfer with memo (AI extracts amount, address, and memo automatically)
    console.log('2️⃣ Transfer with memo...');
    const transferResult = await agent.executePrompt(
      `Send 0.25 STX to ${testAddress} with memo "Coffee payment"`
    );
    console.log('Transfer result:', transferResult);
    console.log();

    // Example 3: Wallet info with transaction history (AI extracts address and limit)
    console.log('3️⃣ Wallet info with transaction history...');
    const walletInfoResult = await agent.executePrompt(
      `Show me the wallet information and last 15 transactions for ${testAddress}`
    );
    console.log('Wallet info result:', walletInfoResult);
    console.log();

    // Example 4: Different ways to express the same intent
    console.log('4️⃣ Different ways to express balance query...');
    const variations = [
      `Check the balance of ${testAddress}`,
      `How much STX does ${testAddress} have?`,
      `Get the balance for wallet ${testAddress}`,
      `What is the STX balance of address ${testAddress}?`
    ];

    for (let i = 0; i < variations.length; i++) {
      console.log(`   Variation ${i + 1}: "${variations[i]}"`);
      const result = await agent.executePrompt(variations[i]);
      console.log(`   Result: ${result.success ? 'Success' : 'Failed'}`);
    }
    console.log();

    // Example 5: Complex multi-tool query
    console.log('5️⃣ Complex multi-tool query...');
    const complexResult = await agent.executePrompt(
      `I want to check the balance of ${testAddress} and then transfer 0.02 STX to ${testAddress}`
    );
    console.log('Complex query result:', complexResult);
    console.log();

    console.log('🎉 Improved AI agent examples completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  promptExample().catch(console.error);
}

export { promptExample };
