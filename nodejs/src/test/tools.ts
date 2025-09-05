import { config } from 'dotenv';
import { createStacksWalletAgent, StacksUtils } from '../index';

// Load environment variables
config();

// Example usage of the Stacks Agent Kit
async function toolsExample() {
  console.log('🚀 Stacks Agent Kit Example\n');

  // Get configuration from environment variables
  const network = process.env.STACKS_NETWORK || 'testnet';
  const testAddress = process.env.STACKS_WALLET_A_ADDRESS;
  const testFromPrivateKey = process.env.STACKS_WALLET_A_PRIVATE_KEY;

  // Validate required environment variables
  if (!testAddress || !testFromPrivateKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   STACKS_WALLET_A_ADDRESS and STACKS_WALLET_A_PRIVATE_KEY must be set in .env file');
    console.error('   Copy .env.example to .env and update with your values');
    process.exit(1);
  }

  // Create an agent for the specified network
  const agent = await createStacksWalletAgent({
    network: network as 'testnet' | 'mainnet',
  });

  console.log('✅ Agent created successfully');
  console.log(`📡 Network: ${network}`);
  console.log(`📍 Wallet Address: ${testAddress}\n`);
  
  try {
    // 1. Query wallet information
    console.log('📊 Querying last 3 transactions of wallet...');
    const walletResult = await agent.queryWallet({
      address: testAddress,
      includeTransactions: true,
      limit: 3
    });

    if (walletResult.success) {
      console.log('✅ Wallet Info:', JSON.stringify(walletResult.data, null, 2));
    } else {
      console.log('❌ Failed to query wallet:', walletResult.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Get balance only
    console.log('💰 Getting wallet balance...');
    const balanceResult = await agent.getBalance({
      address: testAddress
    });

    if (balanceResult.success) {
      console.log(`✅ Balance: ${balanceResult.data} STX`);
    } else {
      console.log('❌ Failed to get balance:', balanceResult.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Validate a transfer (without actually sending)
    console.log('🔍 Validating transfer...');
    const validateResult = await agent.validateTransfer({
      fromPrivateKey: testFromPrivateKey,
      toAddress: testAddress,
      amount: '1.0'
    });

    if (validateResult.success) {
      console.log(`✅ Transfer validation: ${validateResult.data ? 'Valid' : 'Invalid'}`);
    } else {
      console.log('❌ Validation failed:', validateResult.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. Estimate transfer fee
    console.log('💸 Estimating transfer fee...');
    const feeResult = await agent.estimateTransferFee({
      fromPrivateKey: testFromPrivateKey,
      toAddress: testAddress,
      amount: '1.0'
    });

    if (feeResult.success) {
      console.log(`✅ Estimated fee: ${feeResult.data} STX`);
    } else {
      console.log('❌ Fee estimation failed:', feeResult.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. Utility functions example
    console.log('🛠️  Utility functions example...');
    console.log('Format STX:', StacksUtils.formatSTX('1500000')); // "1.500000"
    console.log('Parse STX:', StacksUtils.parseSTX('1.5')); // "1500000"
    console.log('Valid address:', StacksUtils.isValidAddress(testAddress)); // true
    console.log('Invalid address:', StacksUtils.isValidAddress('invalid')); // false

    console.log('\n' + '='.repeat(50) + '\n');

    // 6. Workflow example
    console.log('🔄 Executing simple query workflow...');
    const workflowResult = await agent.executeWorkflow('simple_query', {
      address: testAddress,
      includeTransactions: true,
      limit: 2
    });

    console.log('✅ Workflow result:', JSON.stringify(workflowResult, null, 2));

  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  toolsExample().catch(console.error);
}

export { toolsExample };
