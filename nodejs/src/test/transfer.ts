import { config } from 'dotenv';
import { createStacksWalletAgent } from '../index';
import { makeSTXTokenTransfer, broadcastTransaction, TransactionSigner, transactionToHex } from '@stacks/transactions';

// Load environment variables
config();

async function simpleTransfer() {
  console.log('🔄 Simple STX Transfer - Wallet A to Wallet B\n');

  // Get configuration from environment variables
  const network = process.env.STACKS_NETWORK || 'testnet';
  const walletAAddress = process.env.STACKS_WALLET_A_ADDRESS;
  const walletAPrivateKey = process.env.STACKS_WALLET_A_PRIVATE_KEY;
  const walletBAddress = process.env.STACKS_WALLET_B_ADDRESS;
  const transferAmount = '0.02'; // Amount in STX (will be converted to microSTX internally)

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
    console.log("agent.network.client.baseUrl", agent.network.client.baseUrl);

    const accountResponse = await fetch(`${agent.network.client.baseUrl}/v2/accounts/${walletAAddress}`);
    if (!accountResponse.ok) {
      throw new Error(`Failed to fetch account: ${accountResponse.statusText}`);
    }
    // console.log("accountResponse", accountResponse);
    const accountInfo = await accountResponse.json();
    const nonce = parseInt(accountInfo.nonce || '0');

    console.log(`Nonce: ${nonce}`);

    const txOptions = {
      recipient: walletBAddress,
      amount: 20000n,
      senderKey: walletAPrivateKey,
      network: network as 'testnet' | 'mainnet',
      memo: 'Simple transfer test',
      nonce: nonce,
      fee: 400n,
    };

    const transaction = await makeSTXTokenTransfer(txOptions);
    
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(walletAPrivateKey);
    const signedTx = signer.transaction;
    const serializedTx = transactionToHex(signedTx);
    
    console.log("serializedTx", serializedTx);

    const response = await fetch(`${agent.network.client.baseUrl}/v2/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx: serializedTx }),
    });
    const broadcastResponse = await response.json();

    console.log("broadcastResponse", broadcastResponse);

    if (!response.ok) {
      console.log(`❌ Transfer failed: ${broadcastResponse.error || 'Unknown error'}`);
      console.log('Note: This can be because we are using test addresses with no balance.\n');
      return;
    }

    // If we get here, we have a successful transaction
    const txid = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;
    console.log('✅ Transfer successful!');
    console.log(`Transaction ID: ${txid}\n`);

    // 3. Check final balances
    // console.log('📊 Checking final balances...');
    
    // const finalBalanceA = await agent.getBalance({ address: walletAAddress });
    // const finalBalanceB = await agent.getBalance({ address: walletBAddress });

    // console.log(`Wallet A final balance: ${finalBalanceA.success ? finalBalanceA.data : 'Error'} STX`);
    // console.log(`Wallet B final balance: ${finalBalanceB.success ? finalBalanceB.data : 'Error'} STX`);

  } catch (error) {
    console.error('❌ Transfer failed:', error);
  }
}

// Run the transfer if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  simpleTransfer().catch(console.error);
}

export { simpleTransfer };
