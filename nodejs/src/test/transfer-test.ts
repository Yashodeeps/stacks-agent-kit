import { createStacksWalletAgent } from '../index';

// Test file for wallet A to wallet B transfers
async function transferTest() {
  console.log('🔄 Stacks Transfer Tool Test - Wallet A to Wallet B\n');

  // Create an agent for testnet
  const agent = createStacksWalletAgent({
    network: 'testnet',
  });

  console.log('✅ Agent created successfully\n');

  // Test wallet addresses (testnet)
  const walletA = {
    address: 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM',
    privateKey: 'example-private-key-A', // In real usage, this would be a valid private key
  };

  const walletB = {
    address: 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM',
    privateKey: 'example-private-key-B', // In real usage, this would be a valid private key
  };

  const transferAmount = '0.1'; // 0.1 STX
  const memo = 'Test transfer from wallet A to wallet B';

  try {
    // Test 1: Check initial balances
    console.log('📊 Test 1: Checking initial balances...');
    console.log('='.repeat(50));

    const balanceA = await agent.getBalance({ address: walletA.address });
    const balanceB = await agent.getBalance({ address: walletB.address });

    if (balanceA.success) {
      console.log(`✅ Wallet A balance: ${balanceA.data} STX`);
    } else {
      console.log(`❌ Failed to get Wallet A balance: ${balanceA.error}`);
    }

    if (balanceB.success) {
      console.log(`✅ Wallet B balance: ${balanceB.data} STX`);
    } else {
      console.log(`❌ Failed to get Wallet B balance: ${balanceB.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Validate transfer before execution
    console.log('🔍 Test 2: Validating transfer...');
    console.log('='.repeat(50));

    const validationResult = await agent.validateTransfer({
      fromPrivateKey: walletA.privateKey,
      toAddress: walletB.address,
      amount: transferAmount,
    });

    if (validationResult.success) {
      console.log(`✅ Transfer validation: ${validationResult.data ? 'Valid' : 'Invalid'}`);
      if (!validationResult.data) {
        console.log('⚠️  Transfer cannot be executed (insufficient balance or invalid address)');
      }
    } else {
      console.log(`❌ Validation failed: ${validationResult.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Estimate transfer fee
    console.log('💸 Test 3: Estimating transfer fee...');
    console.log('='.repeat(50));

    const feeEstimate = await agent.estimateTransferFee({
      fromPrivateKey: walletA.privateKey,
      toAddress: walletB.address,
      amount: transferAmount,
      memo: memo,
    });

    if (feeEstimate.success) {
      console.log(`✅ Estimated fee: ${feeEstimate.data} STX`);
    } else {
      console.log(`❌ Fee estimation failed: ${feeEstimate.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Execute the transfer
    console.log('🚀 Test 4: Executing transfer from Wallet A to Wallet B...');
    console.log('='.repeat(50));
    console.log(`From: ${walletA.address}`);
    console.log(`To: ${walletB.address}`);
    console.log(`Amount: ${transferAmount} STX`);
    console.log(`Memo: ${memo}`);

    const transferResult = await agent.transferSTX({
      fromPrivateKey: walletA.privateKey,
      toAddress: walletB.address,
      amount: transferAmount,
      memo: memo,
    });

    if (transferResult.success) {
      console.log(`✅ Transfer successful!`);
      console.log(`Transaction ID: ${transferResult.transactionId}`);
      console.log(`Message: ${transferResult.data}`);
    } else {
      console.log(`❌ Transfer failed: ${transferResult.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Check balances after transfer
    console.log('📊 Test 5: Checking balances after transfer...');
    console.log('='.repeat(50));

    const balanceAAfter = await agent.getBalance({ address: walletA.address });
    const balanceBAfter = await agent.getBalance({ address: walletB.address });

    if (balanceAAfter.success) {
      console.log(`✅ Wallet A balance after: ${balanceAAfter.data} STX`);
    } else {
      console.log(`❌ Failed to get Wallet A balance after: ${balanceAAfter.error}`);
    }

    if (balanceBAfter.success) {
      console.log(`✅ Wallet B balance after: ${balanceBAfter.data} STX`);
    } else {
      console.log(`❌ Failed to get Wallet B balance after: ${balanceBAfter.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Test error scenarios
    console.log('⚠️  Test 6: Testing error scenarios...');
    console.log('='.repeat(50));

    // Test invalid address
    console.log('Testing invalid recipient address...');
    const invalidAddressResult = await agent.validateTransfer({
      fromPrivateKey: walletA.privateKey,
      toAddress: 'invalid-address',
      amount: '0.1',
    });

    if (invalidAddressResult.success) {
      console.log(`✅ Invalid address validation: ${invalidAddressResult.data ? 'Valid' : 'Invalid'}`);
    } else {
      console.log(`✅ Invalid address correctly rejected: ${invalidAddressResult.error}`);
    }

    // Test insufficient amount
    console.log('\nTesting very large transfer amount...');
    const largeAmountResult = await agent.validateTransfer({
      fromPrivateKey: walletA.privateKey,
      toAddress: walletB.address,
      amount: '999999999', // Very large amount
    });

    if (largeAmountResult.success) {
      console.log(`✅ Large amount validation: ${largeAmountResult.data ? 'Valid' : 'Invalid'}`);
    } else {
      console.log(`✅ Large amount correctly rejected: ${largeAmountResult.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 7: Workflow execution
    console.log('🔄 Test 7: Testing workflow execution...');
    console.log('='.repeat(50));

    const workflowResult = await agent.executeWorkflow('simple_transfer', {
      fromPrivateKey: walletA.privateKey,
      toAddress: walletB.address,
      amount: '0.05', // Smaller amount for workflow test
    });

    if (workflowResult.success) {
      console.log(`✅ Workflow execution successful!`);
      console.log(`Transaction ID: ${workflowResult.transactionId}`);
    } else {
      console.log(`❌ Workflow execution failed: ${workflowResult.error}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 8: Multiple transfers simulation
    console.log('🔄 Test 8: Simulating multiple transfers...');
    console.log('='.repeat(50));

    const transferAmounts = ['0.01', '0.02', '0.03'];
    
    for (let i = 0; i < transferAmounts.length; i++) {
      const amount = transferAmounts[i];
      console.log(`\nExecuting transfer ${i + 1}/3: ${amount} STX`);
      
      const multiTransferResult = await agent.transferSTX({
        fromPrivateKey: walletA.privateKey,
        toAddress: walletB.address,
        amount: amount,
        memo: `Multi-transfer test ${i + 1}`,
      });

      if (multiTransferResult.success) {
        console.log(`✅ Transfer ${i + 1} successful: ${multiTransferResult.transactionId}`);
      } else {
        console.log(`❌ Transfer ${i + 1} failed: ${multiTransferResult.error}`);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 9: Final balance check
    console.log('📊 Test 9: Final balance check...');
    console.log('='.repeat(50));

    const finalBalanceA = await agent.getBalance({ address: walletA.address });
    const finalBalanceB = await agent.getBalance({ address: walletB.address });

    if (finalBalanceA.success) {
      console.log(`✅ Final Wallet A balance: ${finalBalanceA.data} STX`);
    } else {
      console.log(`❌ Failed to get final Wallet A balance: ${finalBalanceA.error}`);
    }

    if (finalBalanceB.success) {
      console.log(`✅ Final Wallet B balance: ${finalBalanceB.data} STX`);
    } else {
      console.log(`❌ Failed to get final Wallet B balance: ${finalBalanceB.error}`);
    }

    console.log('\n🎉 Transfer test completed!');

  } catch (error) {
    console.error('❌ Transfer test failed:', error);
  }
}

// Additional utility function for testing with real private keys
async function transferTestWithRealKeys() {
  console.log('🔐 Transfer Test with Real Private Keys\n');
  console.log('⚠️  WARNING: This test requires real private keys and will make actual transactions!');
  console.log('Make sure you are using testnet and have sufficient STX balance.\n');

  const agent = createStacksWalletAgent({
    network: 'testnet',
  });

  // Example with placeholder for real private keys
  const realWalletA = {
    address: 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM',
    privateKey: 'REPLACE_WITH_REAL_PRIVATE_KEY_A', // Replace with actual private key
  };

  const realWalletB = {
    address: 'STC5QXRZ8ZPBKNNY9HSKV0E5D2W5Q2W5QVSYC6DM',
    privateKey: 'REPLACE_WITH_REAL_PRIVATE_KEY_B', // Replace with actual private key
  };

  try {
    // Only proceed if private keys are replaced
    if (realWalletA.privateKey.includes('REPLACE') || realWalletB.privateKey.includes('REPLACE')) {
      console.log('⚠️  Skipping real key test - please replace placeholder private keys');
      return;
    }

    console.log('🚀 Executing real transfer...');
    
    const result = await agent.transferSTX({
      fromPrivateKey: realWalletA.privateKey,
      toAddress: realWalletB.address,
      amount: '0.001', // Small amount for testing
      memo: 'Real transfer test',
    });

    if (result.success) {
      console.log(`✅ Real transfer successful!`);
      console.log(`Transaction ID: ${result.transactionId}`);
    } else {
      console.log(`❌ Real transfer failed: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Real transfer test failed:', error);
  }
}

// Run the tests
async function runAllTests() {
  console.log('🧪 Running All Transfer Tests\n');
  console.log('='.repeat(60) + '\n');

  // Run the main transfer test
  await transferTest();

  console.log('\n' + '='.repeat(60) + '\n');

  // Run the real key test (commented out by default)
  // await transferTestWithRealKeys();

  console.log('\n🏁 All tests completed!');
}

// Export functions for individual testing
export { transferTest, transferTestWithRealKeys, runAllTests };

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
