import { createStacksWalletAgent, StacksUtils } from '../index';

// Example usage of the Stacks Agent Kit
async function example() {
  console.log('🚀 Stacks Agent Kit Example\n');

  // Create an agent for testnet
  const agent = createStacksWalletAgent({
    network: 'testnet',
  });

  console.log('✅ Agent created successfully\n');

  // Example wallet address (testnet)
  const testAddress = 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM';
  const testFromPrivateKey = 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM';
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
      fromPrivateKey: 'example-private-key', // This will fail as expected
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
      fromPrivateKey: testFromPrivateKey, // This will fail as expected
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
example().catch(console.error);
