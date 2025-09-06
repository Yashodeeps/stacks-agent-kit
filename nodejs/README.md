# Stacks Agent Kit

A comprehensive SDK for building AI agents that interact with the Stacks blockchain. This kit provides 18+ tools for wallet management, smart contract deployment & interaction, multi-signature transactions, sponsored transactions, and more - all integrated with LangGraph for workflow management.

## Features

- **🔍 Wallet Operations**: Query balances, transaction history, and account information
- **💸 STX Transfers**: Send STX tokens with validation and fee estimation  
- **📝 Smart Contract Deployment**: Deploy Clarity contracts to the blockchain
- **⚡ Contract Interactions**: Call contract functions and query read-only functions
- **🔐 Key Management**: Generate, import, and validate private keys and addresses
- **👥 Multi-Signature Support**: Create and manage multi-sig transactions
- **💰 Sponsored Transactions**: Enable fee-less transactions for users
- **🔄 Token Swapping**: Exchange STX for other tokens via DEX protocols
- **🤖 AI-Powered Tool Matching**: Use natural language prompts to execute tools
- **📊 LangGraph Integration**: Build complex workflows using state graphs
- **🛡️ TypeScript Support**: Full type safety and IntelliSense support
- **🌐 Network Flexibility**: Support for both mainnet and testnet
- **🧠 Multiple AI Providers**: Support for OpenAI and Anthropic models

## Installation

```bash
npm install stacks-agent-kit
```

## Quick Start

```typescript
import { createStacksWalletAgent } from 'stacks-agent-kit';

// Create an agent for testnet
const agent = createStacksWalletAgent({
  network: 'testnet',
});

// Get available tools
const tools = agent.getTools();

// Query a wallet
const walletInfo = await tools[0].execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  includeTransactions: true,
  limit: 5
});

console.log(walletInfo);
```

## AI-Powered Agent Usage

The Stacks Agent Kit now supports AI-powered tool matching using natural language prompts. You can initialize an agent with AI configuration and private key management:

```typescript
import { createStacksWalletAgent } from 'stacks-agent-kit';

// Create an AI-powered agent with private key initialization
const agent = createStacksWalletAgent({
  privateKey: 'your-private-key-here', // Optional: Initialize with a private key
  network: 'testnet',
  model: 'gpt-4o-mini', // Optional: Default is 'gpt-4o-mini'
  openAiApiKey: process.env.OPENAI_API_KEY, // Optional: For OpenAI integration
  // anthropicApiKey: process.env.ANTHROPIC_API_KEY, // Optional: For Anthropic integration
});

// Use natural language to execute tools (AI extracts all parameters automatically)
const result = await agent.executePrompt(
  'What is the balance of wallet address SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7?'
);

// Transfer STX using natural language (AI extracts amount, address, memo automatically)
const transferResult = await agent.executePrompt(
  'Transfer 0.1 STX to SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 with memo "Payment for services"'
);

// Get wallet info with transaction history (AI extracts address and limit automatically)
const walletInfo = await agent.executePrompt(
  'Show me the wallet information and last 10 transactions for SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
);
```

### Private Key Management

When you initialize an agent with a private key, you can omit the `fromPrivateKey` parameter in transfer operations:

```typescript
// With initialized private key, you can omit fromPrivateKey
const transferResult = await agent.transferSTX({
  toAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  amount: '0.1'
  // fromPrivateKey is automatically used from agent initialization
});

// Check initialized private key
const initializedKey = agent.getInitializedKey();
if (initializedKey) {
  console.log(`Initialized address: ${initializedKey.address}`);
}
```

### AI Model Configuration

The agent supports both OpenAI and Anthropic models:

```typescript
// OpenAI configuration
const openaiAgent = createStacksWalletAgent({
  network: 'testnet',
  model: 'gpt-4o-mini',
  openAiApiKey: process.env.OPENAI_API_KEY,
});

// Anthropic configuration
const anthropicAgent = createStacksWalletAgent({
  network: 'testnet',
  model: 'claude-3-haiku-20240307',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});
```

### Intelligent Parameter Extraction

The AI-powered agent automatically extracts all necessary parameters from your natural language prompts:

```typescript
// The AI will extract the address from this prompt
await agent.executePrompt('Check the balance of SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');

// The AI will extract amount, toAddress, and memo from this prompt
await agent.executePrompt('Send 1.5 STX to SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 with memo "Payment"');

// The AI will extract address and limit from this prompt
await agent.executePrompt('Show me the last 20 transactions for SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');

// The AI will extract amount and toAddress from this prompt
await agent.executePrompt('Transfer 0.5 STX to SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');
```

The AI understands various ways to express the same intent:
- "balance of [address]" → extracts address parameter
- "send [amount] STX to [address]" → extracts amount and toAddress
- "transfer [amount] to [address]" → extracts amount and toAddress
- "last [number] transactions" → extracts limit parameter
- "with memo [text]" → extracts memo parameter

## Configuration Options

The `createStacksWalletAgent` function accepts the following configuration:

```typescript
interface AgentConfig {
  privateKey?: string;           // Optional: Initialize with a private key
  network: 'mainnet' | 'testnet'; // Required: Network to use
  coreApiUrl?: string;           // Optional: Custom core API URL
  broadcastApiUrl?: string;     // Optional: Custom broadcast API URL
  model?: string;               // Optional: AI model to use (default: 'gpt-4o-mini')
  openAiApiKey?: string;        // Optional: OpenAI API key
  anthropicApiKey?: string;    // Optional: Anthropic API key
  defaultFee?: string;          // Optional: Default fee for transactions
}
```

### Example Configurations

```typescript
// Basic configuration
const basicAgent = createStacksWalletAgent({
  network: 'testnet'
});

// With private key initialization
const agentWithKey = createStacksWalletAgent({
  privateKey: 'your-private-key-here',
  network: 'testnet'
});

// With AI integration
const aiAgent = createStacksWalletAgent({
  privateKey: 'your-private-key-here',
  network: 'testnet',
  model: 'gpt-4o-mini',
  openAiApiKey: process.env.OPENAI_API_KEY
});

// With custom network URLs
const customAgent = createStacksWalletAgent({
  network: 'testnet',
  coreApiUrl: 'https://custom-core-api.com',
  broadcastApiUrl: 'https://custom-broadcast-api.com'
});
```

## Tools Available (18 Total)

The Stacks Agent Kit provides 18 comprehensive tools organized into 9 categories:

### 🔍 **Wallet & Balance Tools (3 tools)**

#### 1. Query Wallet (`query_wallet`)
Get comprehensive wallet information including balance, nonce, and transaction history.

```typescript
const result = await agent.getTools().find(t => t.name === 'query_wallet').execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  includeTransactions: true,
  limit: 10
});
```

#### 2. Get Balance (`get_balance`)
Get the STX balance of a specific wallet address.

```typescript
const result = await agent.getTools().find(t => t.name === 'get_balance').execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
});
```

### 💸 **STX Transfer Tools (3 tools)**

#### 3. Transfer STX (`transfer_stx`)
Transfer STX tokens from one wallet to another.

```typescript
const result = await agent.getTools().find(t => t.name === 'transfer_stx').execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5', // 1.5 STX
  memo: 'Payment for services'
});
```

#### 4. Estimate Transfer Fee (`estimate_transfer_fee`)
Estimate the fee required for a STX transfer.

```typescript
const result = await agent.getTools().find(t => t.name === 'estimate_transfer_fee').execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
```

#### 5. Validate Transfer (`validate_transfer`)
Validate if a transfer can be executed (checks balance and address validity).

```typescript
const result = await agent.getTools().find(t => t.name === 'validate_transfer').execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
```

### 📝 **Smart Contract Deployment Tools (2 tools)**

#### 6. Deploy Contract (`deploy_contract`)
Deploy a Clarity smart contract to the Stacks blockchain.

```typescript
const contractCode = `
  ;; Simple Counter Contract
  (define-data-var counter uint u0)
  
  (define-public (increment)
    (ok (var-set counter (+ (var-get counter) u1))))
    
  (define-read-only (get-counter)
    (var-get counter))
`;

const result = await agent.getTools().find(t => t.name === 'deploy_contract').execute({
  fromPrivateKey: 'your-private-key',
  contractName: 'my-counter',
  codeBody: contractCode,
  fee: '0.1' // Optional fee override
});
```

#### 7. Estimate Deploy Fee (`estimate_deploy_fee`)
Estimate the fee required for deploying a smart contract.

```typescript
const result = await agent.getTools().find(t => t.name === 'estimate_deploy_fee').execute({
  fromPrivateKey: 'your-private-key',
  contractName: 'my-counter',
  codeBody: contractCode
});
```

### ⚡ **Smart Contract Interaction Tools (3 tools)**

#### 8. Call Contract (`call_contract`)
Call a function in a deployed smart contract (state-changing).

```typescript
import { uintCV } from '@stacks/transactions';

const result = await agent.getTools().find(t => t.name === 'call_contract').execute({
  fromPrivateKey: 'your-private-key',
  contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  contractName: 'my-counter',
  functionName: 'increment',
  functionArgs: [], // No arguments for increment
  validateWithAbi: true
});
```

#### 9. Call Read-Only Function (`call_readonly_function`)
Call a read-only function in a smart contract (no transaction required).

```typescript
const result = await agent.getTools().find(t => t.name === 'call_readonly_function').execute({
  contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  contractName: 'my-counter',
  functionName: 'get-counter',
  functionArgs: []
});
```

#### 10. Get Contract ABI (`get_contract_abi`)
Get the ABI (Application Binary Interface) of a deployed contract.

```typescript
const result = await agent.getTools().find(t => t.name === 'get_contract_abi').execute({
  contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  contractName: 'my-counter'
});
```

#### 11. Get Contract Source (`get_contract_source`)
Get the source code of a deployed contract.

```typescript
const result = await agent.getTools().find(t => t.name === 'get_contract_source').execute({
  contractAddress: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  contractName: 'my-counter'
});
```

### 🔐 **Key Management Tools (3 tools)**

#### 12. Generate Key (`generate_key`)
Generate a new random private/public key pair.

```typescript
const result = await agent.getTools().find(t => t.name === 'generate_key').execute({
  network: 'testnet' // or 'mainnet'
});

console.log('Generated key:', result.data);
// Output: { privateKey: '...', publicKey: '...', address: 'ST...', network: 'testnet' }
```

#### 13. Import Key (`import_key`)
Import an existing private key and get the corresponding public key and address.

```typescript
const result = await agent.getTools().find(t => t.name === 'import_key').execute({
  privateKeyHex: 'your-64-character-hex-private-key',
  network: 'testnet'
});
```

#### 14. Validate Address (`validate_address`)
Validate a Stacks address format and determine its network.

```typescript
const result = await agent.getTools().find(t => t.name === 'validate_address').execute({
  address: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE'
});

console.log('Valid:', result.data.valid, 'Network:', result.data.network);
```

### 👥 **Multi-Signature Tools (2 tools)**

#### 15. Create Multi-Sig STX Transfer (`create_multisig_stx_transfer`)
Create an unsigned multi-signature STX transfer transaction.

```typescript
const result = await agent.getTools().find(t => t.name === 'create_multisig_stx_transfer').execute({
  recipients: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  amount: '1.0',
  memo: 'Multi-sig payment',
  numSignatures: 2, // Require 2 signatures
  publicKeys: [
    '03797dd653040d344fd048c1ad05d4cbcb2178b30c6a0c4276994795fdc5bb3dea',
    '03a5c7b7d5c9c8e4f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    '02f4c7e0d4c8a9b3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8'
  ] // 3 public keys for a 2-of-3 multi-sig
});
```

#### 16. Sign Multi-Sig Transaction (`sign_multisig_transaction`)
Sign a multi-signature transaction with a private key.

```typescript
const result = await agent.getTools().find(t => t.name === 'sign_multisig_transaction').execute({
  transactionHex: 'hex-encoded-unsigned-transaction',
  privateKey: 'signer-private-key'
});
```

### 💰 **Sponsored Transaction Tools (2 tools)**

#### 17. Create Sponsored STX Transfer (`create_sponsored_stx_transfer`)
Create a sponsored STX transfer where the origin pays no fees.

```typescript
const result = await agent.getTools().find(t => t.name === 'create_sponsored_stx_transfer').execute({
  originPrivateKey: 'origin-private-key', // Transaction creator
  recipient: 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
  amount: '0.5',
  memo: 'Sponsored transaction'
});
```

#### 18. Sponsor Transaction (`sponsor_transaction`)
Sponsor an existing transaction by paying the fee.

```typescript
const result = await agent.getTools().find(t => t.name === 'sponsor_transaction').execute({
  transactionHex: 'hex-encoded-sponsored-transaction',
  sponsorPrivateKey: 'sponsor-private-key', // Fee payer
  fee: '0.001', // Fee amount in STX
  sponsorNonce: 42 // Optional nonce override
});
```

### 🔄 **Token Swapping Tools (Already Existing)**

The agent also includes token swapping capabilities for exchanging STX with other tokens via DEX protocols.

## 🤖 AI-Powered Natural Language Examples

The Stacks Agent Kit's AI integration allows you to use natural language to execute any of the 18 tools:

### Smart Contract Operations
```typescript
// Deploy a contract
await agent.executePrompt(
  "Deploy a counter contract with increment and decrement functions"
);

// Call a contract function
await agent.executePrompt(
  "Call the increment function on contract ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.my-counter"
);

// Query contract state
await agent.executePrompt(
  "What is the current counter value in contract ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.my-counter?"
);
```

### Key Management Operations
```typescript
// Generate new keys
await agent.executePrompt(
  "Generate a new testnet wallet address for me"
);

// Validate addresses
await agent.executePrompt(
  "Is ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE a valid Stacks address?"
);

// Import existing keys
await agent.executePrompt(
  "Import the private key b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01 for testnet"
);
```

### Multi-Signature Operations
```typescript
// Create multi-sig transaction
await agent.executePrompt(
  "Create a 2-of-3 multi-signature transaction to send 1 STX to ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE"
);

// Sign multi-sig transaction
await agent.executePrompt(
  "Sign the multi-sig transaction with hex abc123... using my private key"
);
```

### Sponsored Transaction Operations
```typescript
// Create sponsored transaction
await agent.executePrompt(
  "Create a sponsored transaction to send 0.5 STX to ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE where the recipient pays no fees"
);

// Sponsor a transaction
await agent.executePrompt(
  "I want to sponsor transaction abc123... and pay 0.001 STX in fees"
);
```

## Advanced Usage Examples

### Complete Smart Contract Workflow
```typescript
import { createStacksWalletAgent } from 'stacks-agent-kit';
import { stringAsciiCV, uintCV } from '@stacks/transactions';

const agent = createStacksWalletAgent({
  privateKey: 'your-private-key',
  network: 'testnet',
  openAiApiKey: process.env.OPENAI_API_KEY
});

// 1. Deploy a contract
const contractCode = `
  (define-map user-scores principal uint)
  
  (define-public (set-score (user principal) (score uint))
    (ok (map-set user-scores user score)))
    
  (define-read-only (get-score (user principal))
    (map-get? user-scores user))
`;

const deployResult = await agent.executePrompt(
  `Deploy a user scores contract with this code: ${contractCode}`
);

// 2. Call the contract
await agent.executePrompt(
  "Set my score to 100 in the user-scores contract"
);

// 3. Query the contract
const scoreResult = await agent.executePrompt(
  "What is my current score in the user-scores contract?"
);
```

### Multi-Signature Workflow
```typescript
// Step 1: Generate keys for multi-sig participants
const key1 = await agent.executePrompt("Generate a new testnet key");
const key2 = await agent.executePrompt("Generate a new testnet key");  
const key3 = await agent.executePrompt("Generate a new testnet key");

// Step 2: Create unsigned multi-sig transaction
const multiSigTx = await agent.executePrompt(
  `Create a 2-of-3 multi-sig transaction sending 1 STX to ST1RECIPIENT using public keys ${key1.data.publicKey}, ${key2.data.publicKey}, ${key3.data.publicKey}`
);

// Step 3: Sign with first key
const signed1 = await agent.executePrompt(
  `Sign transaction ${multiSigTx.data.transactionHex} with private key ${key1.data.privateKey}`
);

// Step 4: Sign with second key (now complete)
const signed2 = await agent.executePrompt(
  `Sign transaction ${signed1.data.transactionHex} with private key ${key2.data.privateKey}`
);

// Step 5: Broadcast if complete
if (signed2.data.isComplete) {
  await agent.executePrompt(
    `Broadcast the completed multi-sig transaction ${signed2.data.transactionHex}`
  );
}
```

### Sponsored Transaction Workflow
```typescript
// Origin creates transaction (pays no fees)
const sponsoredTx = await agent.executePrompt(
  "Create a sponsored transaction to send 0.5 STX to ST1RECIPIENT with memo 'Fee-free payment'"
);

// Sponsor pays the fees and broadcasts
const sponsorResult = await agent.executePrompt(
  `I want to sponsor transaction ${sponsoredTx.data.transactionHex} and pay 0.002 STX in fees`
);

// Broadcast the sponsored transaction
await agent.executePrompt(
  `Broadcast the sponsored transaction ${sponsorResult.data.transactionHex}`
);
```

## Workflow Examples

### Simple Query Workflow
```typescript
const result = await agent.executeWorkflow('simple_query', {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  includeTransactions: true
});
```

### Transfer with Validation
```typescript
const result = await agent.executeWorkflow('simple_transfer', {
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
```

### Complete Query and Transfer Workflow
```typescript
const result = await agent.executeWorkflow('query_and_transfer', {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
```

## Configuration

### Network Configuration
```typescript
import { StacksWalletAgent } from 'stacks-agent-kit';

const agent = new StacksWalletAgent({
  network: {
    network: 'testnet', // or 'mainnet'
    coreApiUrl: 'https://api.testnet.hiro.so', // optional - for reading blockchain data
    broadcastApiUrl: 'https://api.testnet.hiro.so', // optional - for broadcasting transactions
  },
  defaultFee: '0.001' // optional default fee in STX
});
```

**Note:** Both `coreApiUrl` and `broadcastApiUrl` are optional. If provided, they will override the default Stacks API endpoints. The Stacks blockchain uses the same endpoint for both reading and broadcasting, so typically you'll set both to the same URL or just set `coreApiUrl` (which takes precedence).

### Custom Network URLs
```typescript
const agent = new StacksWalletAgent({
  network: {
    network: 'testnet',
    coreApiUrl: 'https://your-custom-api.com', // Custom API endpoint
    broadcastApiUrl: 'https://your-custom-broadcast.com', // Custom broadcast endpoint
  }
});
```

**Use Cases for Custom URLs:**
- **Development**: Point to local Stacks API servers
- **Custom Providers**: Use alternative Stacks API providers
- **Load Balancing**: Distribute API calls across multiple endpoints
- **Testing**: Use staging or testing environments

## Utility Functions

```typescript
import { StacksUtils } from 'stacks-agent-kit';

// Format microSTX to STX
const formatted = StacksUtils.formatSTX('1500000'); // "1.500000"

// Parse STX to microSTX
const parsed = StacksUtils.parseSTX('1.5'); // "1500000"

// Validate address
const isValid = StacksUtils.isValidAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'); // true
```

## Error Handling

All tools return a `ToolResult` object with the following structure:

```typescript
interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionId?: string; // for transfer operations
}
```

Example error handling:
```typescript
const result = await agent.getTools()[2].execute({
  fromPrivateKey: 'invalid-key',
  toAddress: 'invalid-address',
  amount: '1.5'
});

if (!result.success) {
  console.error('Transfer failed:', result.error);
} else {
  console.log('Transaction ID:', result.transactionId);
}
```

## 🔒 Security Considerations

- **🔐 Private Keys**: Never hardcode private keys in your application. Use environment variables or secure key management systems.
- **🌐 Network Selection**: Always use testnet for development and testing.
- **✅ Validation**: Always validate transfers before execution using the `validate_transfer` tool.
- **💰 Fee Estimation**: Use fee estimation to ensure sufficient balance for transactions.
- **🔍 Contract Verification**: Always verify contract source code before interacting with unknown contracts.
- **👥 Multi-Sig Security**: Use multi-signature wallets for high-value operations.
- **💸 Sponsored Transaction Limits**: Set reasonable limits on sponsored transaction amounts.
- **🔄 Transaction Monitoring**: Monitor all transaction broadcasts for success/failure.

## 📊 Tool Categories Summary

| Category | Tools | Description |
|----------|-------|-------------|
| 🔍 **Wallet & Balance** | 3 | Query wallets, check balances, get transaction history |
| 💸 **STX Transfers** | 3 | Send STX, estimate fees, validate transfers |
| 📝 **Contract Deployment** | 2 | Deploy smart contracts, estimate deployment fees |
| ⚡ **Contract Interaction** | 3 | Call functions, query read-only functions, get ABIs |
| 🔐 **Key Management** | 3 | Generate keys, import keys, validate addresses |
| 👥 **Multi-Signature** | 2 | Create multi-sig transactions, sign transactions |
| 💰 **Sponsored Transactions** | 2 | Create sponsored transactions, sponsor existing transactions |
| 🔄 **Token Swapping** | 2 | Swap STX for tokens, get swap quotes |

**Total: 18 Tools** ready for AI agent integration! 🤖

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development mode with watch
npm run dev
```

## License

MIT

## Environment Configuration

The example scripts now use environment variables for sensitive configuration. Follow these steps:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the .env file with your actual values:**
   ```bash
   # Replace with your actual private key (hex format)
   STACKS_PRIVATE_KEY=your_actual_private_key_here
   
   # Replace with your wallet address
   STACKS_WALLET_ADDRESS=your_actual_wallet_address_here
   
   # Choose network (testnet or mainnet)
   STACKS_NETWORK=testnet
   ```

3. **Run the example:**
   ```bash
   npm run dev
   # or
   npx ts-node src/test/example.ts
   ```

**Security Note:** The `.env` file is already in `.gitignore` to prevent accidentally committing sensitive keys to version control.

## Transfer Test Configuration

The transfer test (`transfer-test.ts`) requires two wallets for testing transfers between them:

1. **Update your `.env` file with both wallet configurations:**
   ```bash
   # Network configuration
   STACKS_NETWORK=testnet
   
   # Wallet A (sender)
   STACKS_WALLET_A_PRIVATE_KEY=your_wallet_a_private_key_here
   STACKS_WALLET_A_ADDRESS=your_wallet_a_address_here
   
   # Wallet B (receiver)  
   STACKS_WALLET_B_PRIVATE_KEY=your_wallet_b_private_key_here
   STACKS_WALLET_B_ADDRESS=your_wallet_b_address_here
   ```

2. **Run the transfer test:**
   ```bash
   npx ts-node src/test/transfer-test.ts
   ```

**Note:** The transfer test will make actual transactions on the specified network. Make sure you're using testnet and have sufficient STX balance in Wallet A.
