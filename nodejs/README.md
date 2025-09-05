# Stacks Agent Kit

A comprehensive SDK for building AI agents that interact with the Stacks blockchain. This kit provides tools for querying wallet information and transferring STX tokens, integrated with LangGraph for workflow management.

## Features

- **Wallet Querying**: Get balances, transaction history, and account information
- **STX Transfers**: Send STX tokens between wallets with validation and fee estimation
- **AI-Powered Tool Matching**: Use natural language prompts to match and execute tools
- **Private Key Management**: Initialize and manage private keys securely
- **LangGraph Integration**: Build complex workflows using state graphs
- **TypeScript Support**: Full type safety and IntelliSense support
- **Network Flexibility**: Support for both mainnet and testnet
- **Multiple AI Providers**: Support for OpenAI and Anthropic models

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

## Tools Available

### 1. Query Wallet (`query_wallet`)
Get comprehensive wallet information including balance, nonce, and transaction history.

```typescript
const result = await agent.getTools()[0].execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  includeTransactions: true,
  limit: 10
});
```

### 2. Get Balance (`get_balance`)
Get the STX balance of a specific wallet address.

```typescript
const result = await agent.getTools()[1].execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
});
```

### 3. Transfer STX (`transfer_stx`)
Transfer STX tokens from one wallet to another.

```typescript
const result = await agent.getTools()[2].execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5', // 1.5 STX
  memo: 'Payment for services'
});
```

### 4. Estimate Transfer Fee (`estimate_transfer_fee`)
Estimate the fee required for a STX transfer.

```typescript
const result = await agent.getTools()[3].execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
```

### 5. Validate Transfer (`validate_transfer`)
Validate if a transfer can be executed (checks balance and address validity).

```typescript
const result = await agent.getTools()[4].execute({
  fromPrivateKey: 'your-private-key',
  toAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  amount: '1.5'
});
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

## Security Considerations

- **Private Keys**: Never hardcode private keys in your application. Use environment variables or secure key management systems.
- **Network Selection**: Always use testnet for development and testing.
- **Validation**: Always validate transfers before execution using the `validate_transfer` tool.
- **Fee Estimation**: Use fee estimation to ensure sufficient balance for transactions.

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
