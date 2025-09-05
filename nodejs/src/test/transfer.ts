import { config } from 'dotenv';
import { createStacksWalletAgent } from '../index';

// Load environment variables
config();

async function simpleTransfer() {
  console.log('🔄 Simple STX Transfer - Wallet A to Wallet B\n');

  // Get configuration from environment variables
  const network = process.env.STACKS_NETWORK || 'testnet';
  const walletAAddress = process.env.STACKS_WALLET_A_ADDRESS;
  const walletAPrivateKey = process.env.STACKS_WALLET_A_PRIVATE_KEY;
  const walletBAddress = process.env.STACKS_WALLET_B_ADDRESS;
  const transferAmount = '0.02'; // 0.02 STX

  // Validate required environment variables
  if (!walletAAddress || !walletAPrivateKey || !walletBAddress) {
    console.error('❌ Missing required environment variables:');
    console.error('   STACKS_WALLET_A_ADDRESS, STACKS_WALLET_A_PRIVATE_KEY');
    console.error('   STACKS_WALLET_B_ADDRESS must be set in .env file');
    process.exit(1);
  }

  // Create an agent for the specified network
  const agent = await createStacksWalletAgent({
    network: network as 'testnet' | 'mainnet',
  });

  console.log(`📡 Network: ${network}`);
  console.log(`📍 From Address: ${walletAAddress}`);
  console.log(`📍 To Address: ${walletBAddress}\n`);

  try {
    // 1. Check initial balances
    console.log('📊 Checking initial balances...');
    
    const balanceA = await agent.getBalance({ address: walletAAddress });
    const balanceB = await agent.getBalance({ address: walletBAddress });

    console.log(`Wallet A balance: ${balanceA.success ? balanceA.data : 'Error'} STX`);
    console.log(`Wallet B balance: ${balanceB.success ? balanceB.data : 'Error'} STX\n`);

    // 2. Perform the transfer
    console.log(`🚀 Transferring ${transferAmount} STX...`);

    const transferResult = await agent.transferSTX({
      fromPrivateKey: walletAPrivateKey,
      toAddress: walletBAddress,
      amount: transferAmount,
      memo: 'Simple transfer test',
    });

    if (transferResult.success) {
      console.log('✅ Transfer successful!');
      console.log(`Transaction ID: ${transferResult.transactionId}\n`);
    } else {
      console.log(`❌ Transfer failed: ${transferResult.error}\n`);
      return;
    }

    // 3. Check final balances
    console.log('📊 Checking final balances...');
    
    const finalBalanceA = await agent.getBalance({ address: walletAAddress });
    const finalBalanceB = await agent.getBalance({ address: walletBAddress });

    console.log(`Wallet A final balance: ${finalBalanceA.success ? finalBalanceA.data : 'Error'} STX`);
    console.log(`Wallet B final balance: ${finalBalanceB.success ? finalBalanceB.data : 'Error'} STX`);

  } catch (error) {
    console.error('❌ Transfer failed:', error);
  }
}

// Run the transfer if this file is executed directly
if (require.main === module) {
  simpleTransfer().catch(console.error);
}

export { simpleTransfer };
