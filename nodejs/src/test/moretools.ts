import { createStacksWalletAgent } from '../index.js';
import { 
  uintCV, 
  stringAsciiCV, 
  bufferCVFromString, 
  standardPrincipalCV,
  tupleCV,
  intCV
} from '@stacks/transactions';

async function demonstrateMoreTools() {
  console.log('🚀 Demonstrating New Stacks Agent Kit Tools\n');

  // Initialize the agent
  const agent = await createStacksWalletAgent({
    network: 'testnet',
  });

  const tools = agent.getTools();
  console.log(`📋 Total tools available: ${tools.length}\n`);

  // 1. Key Management Tools
  console.log('🔐 KEY MANAGEMENT TOOLS');
  console.log('='.repeat(50));
  
  // Generate a new key
  const generateKeyTool = tools.find((t: any) => t.name === 'generate_key');
  if (generateKeyTool) {
    const keyResult = await generateKeyTool.execute({ network: 'testnet' });
    console.log('✅ Generated new key:', keyResult);
    
    if (keyResult.success && keyResult.data) {
      const { privateKey, publicKey, address } = keyResult.data;
      
      // Validate the generated address
      const validateTool = tools.find((t: any) => t.name === 'validate_address');
      if (validateTool) {
        const validationResult = await validateTool.execute({ address });
        console.log('✅ Address validation:', validationResult);
      }
    }
  }

  // 2. Contract Deployment Tools
  console.log('\n📝 CONTRACT DEPLOYMENT TOOLS');
  console.log('='.repeat(50));

  // Simple counter contract
  const counterContract = `
    ;; Simple Counter Contract
    (define-data-var counter uint u0)

    (define-public (increment)
      (ok (var-set counter (+ (var-get counter) u1))))

    (define-public (decrement)
      (ok (var-set counter (- (var-get counter) u1))))

    (define-read-only (get-counter)
      (var-get counter))

    (define-public (set-counter (value uint))
      (ok (var-set counter value)))
  `;

  const deployTool = tools.find((t: any) => t.name === 'deploy_contract');
  const estimateDeployFeeTool = tools.find((t: any) => t.name === 'estimate_deploy_fee');

  if (estimateDeployFeeTool) {
    console.log('💰 Estimating deployment fee...');
    // Note: This will fail without a real private key, but shows the structure
    console.log('ℹ️  Would estimate fee for counter contract deployment');
  }

  // 3. Read-Only Contract Calls
  console.log('\n📖 READ-ONLY CONTRACT TOOLS');
  console.log('='.repeat(50));

  const readOnlyTool = tools.find((t: any) => t.name === 'call_readonly_function');
  if (readOnlyTool) {
    console.log('📚 Example: Calling a read-only function');
    console.log('ℹ️  Would call get-counter function on deployed contract');
    
    // Example structure for calling a read-only function
    const exampleParams = {
      contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      contractName: 'counter-contract',
      functionName: 'get-counter',
      functionArgs: [],
    };
    console.log('📋 Example parameters:', JSON.stringify(exampleParams, null, 2));
  }

  // 4. Contract ABI and Source
  console.log('\n🔍 CONTRACT INSPECTION TOOLS');
  console.log('='.repeat(50));

  const getAbiTool = tools.find((t: any) => t.name === 'get_contract_abi');
  const getSourceTool = tools.find((t: any) => t.name === 'get_contract_source');

  if (getAbiTool && getSourceTool) {
    console.log('🔍 Contract inspection tools available');
    console.log('  - get_contract_abi: Get contract interface');
    console.log('  - get_contract_source: Get contract source code');
  }

  // 5. Multi-Signature Tools
  console.log('\n👥 MULTI-SIGNATURE TOOLS');
  console.log('='.repeat(50));

  const createMultiSigTool = tools.find((t: any) => t.name === 'create_multisig_stx_transfer');
  const signMultiSigTool = tools.find((t: any) => t.name === 'sign_multisig_transaction');

  if (createMultiSigTool) {
    console.log('👥 Multi-signature transaction creation available');
    
    // Example of creating a multi-sig transaction
    const exampleMultiSigParams = {
      recipients: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      amount: '1.0',
      memo: 'Multi-sig test transaction',
      numSignatures: 2,
      publicKeys: [
        '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795fdc5bb3dea',
        '03a5c7b7d5c9c8e4f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5'
      ]
    };
    console.log('📋 Example multi-sig parameters:', JSON.stringify(exampleMultiSigParams, null, 2));
  }

  // 6. Sponsored Transaction Tools
  console.log('\n💰 SPONSORED TRANSACTION TOOLS');
  console.log('='.repeat(50));

  const createSponsoredTool = tools.find((t: any) => t.name === 'create_sponsored_stx_transfer');
  const sponsorTool = tools.find((t: any) => t.name === 'sponsor_transaction');

  if (createSponsoredTool && sponsorTool) {
    console.log('💰 Sponsored transaction tools available');
    console.log('  - create_sponsored_stx_transfer: Create transaction with no origin fee');
    console.log('  - sponsor_transaction: Sponsor an existing transaction');
    
    const exampleSponsoredParams = {
      originPrivateKey: 'origin-private-key-here',
      recipient: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      amount: '1.0',
      memo: 'Sponsored transaction example'
    };
    console.log('📋 Example sponsored tx parameters:', JSON.stringify(exampleSponsoredParams, null, 2));
  }

  // 7. Contract Function Calls
  console.log('\n⚡ CONTRACT FUNCTION CALL TOOLS');
  console.log('='.repeat(50));

  const callContractTool = tools.find((t: any) => t.name === 'call_contract');
  if (callContractTool) {
    console.log('⚡ Contract function call tool available');
    
    // Example of calling a contract function
    const exampleCallParams = {
      fromPrivateKey: 'caller-private-key-here',
      contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      contractName: 'counter-contract',
      functionName: 'set-counter',
      functionArgs: [uintCV(42)], // Set counter to 42
      validateWithAbi: true
    };
    console.log('📋 Example contract call parameters structure shown');
  }

  // Summary
  console.log('\n📊 TOOL SUMMARY');
  console.log('='.repeat(50));
  
  const toolCategories = {
    'Query & Balance': ['query_wallet', 'get_balance'],
    'STX Transfers': ['transfer_stx', 'estimate_transfer_fee', 'validate_transfer'],
    'Token Swaps': ['swap_stx', 'get_swap_quote'],
    'Contract Deployment': ['deploy_contract', 'estimate_deploy_fee'],
    'Contract Calls': ['call_contract', 'get_contract_abi', 'get_contract_source'],
    'Read-Only Calls': ['call_readonly_function'],
    'Key Management': ['generate_key', 'import_key', 'validate_address'],
    'Multi-Signature': ['create_multisig_stx_transfer', 'sign_multisig_transaction'],
    'Sponsored Transactions': ['create_sponsored_stx_transfer', 'sponsor_transaction']
  };

  for (const [category, toolNames] of Object.entries(toolCategories)) {
    const availableTools = toolNames.filter(name => tools.some((t: any) => t.name === name));
    console.log(`${category}: ${availableTools.length}/${toolNames.length} tools`);
    availableTools.forEach(name => console.log(`  ✅ ${name}`));
  }

  console.log(`\n🎉 Total: ${tools.length} tools available for AI agents!`);
}

// Example usage patterns
export function getUsageExamples() {
  return {
    // Key management
    generateKey: {
      tool: 'generate_key',
      params: { network: 'testnet' },
      description: 'Generate a new random key pair'
    },
    
    // Contract deployment
    deployContract: {
      tool: 'deploy_contract',
      params: {
        fromPrivateKey: 'your-private-key',
        contractName: 'my-contract',
        codeBody: '(define-constant CONTRACT_OWNER tx-sender)'
      },
      description: 'Deploy a simple contract'
    },
    
    // Read-only call
    readOnlyCall: {
      tool: 'call_readonly_function',
      params: {
        contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
        contractName: 'counter',
        functionName: 'get-counter',
        functionArgs: []
      },
      description: 'Call a read-only function'
    },
    
    // Contract function call
    contractCall: {
      tool: 'call_contract',
      params: {
        fromPrivateKey: 'your-private-key',
        contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
        contractName: 'counter',
        functionName: 'increment',
        functionArgs: []
      },
      description: 'Call a contract function that modifies state'
    },
    
    // Multi-sig transaction
    multiSigTransfer: {
      tool: 'create_multisig_stx_transfer',
      params: {
        recipients: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
        amount: '1.0',
        numSignatures: 2,
        publicKeys: ['pubkey1', 'pubkey2', 'pubkey3']
      },
      description: 'Create a 2-of-3 multi-signature transaction'
    },
    
    // Sponsored transaction
    sponsoredTransfer: {
      tool: 'create_sponsored_stx_transfer',
      params: {
        originPrivateKey: 'origin-private-key',
        recipient: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
        amount: '0.5',
        memo: 'Sponsored by someone else'
      },
      description: 'Create a sponsored transaction where someone else pays the fee'
    }
  };
}

// Run the demonstration if this file is executed directly
// Note: This check works in ES modules, but we'll keep it simple for compatibility
// if (import.meta.url === `file://${process.argv[1]}`) {
//   demonstrateNewTools().catch(console.error);
// }

// Alternative way to run the demo
if (require.main === module) {
  demonstrateMoreTools().catch(console.error);
}

export { demonstrateMoreTools };
