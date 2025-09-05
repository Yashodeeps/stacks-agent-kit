# Stacks Agent Kit

A comprehensive SDK for building AI agents that interact with the Stacks blockchain. This kit provides tools for querying wallet information and transferring STX tokens, integrated with LangGraph for workflow management.

## Features

- **Wallet Querying**: Get balances, transaction history, and account information
- **STX Transfers**: Send STX tokens between wallets with validation and fee estimation
- **LangGraph Integration**: Build complex workflows using state graphs
- **TypeScript Support**: Full type safety and IntelliSense support
- **Network Flexibility**: Support for both mainnet and testnet

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
    coreApiUrl: 'https://api.testnet.hiro.so', // optional
    broadcastApiUrl: 'https://api.testnet.hiro.so', // optional
  },
  defaultFee: '0.001' // optional default fee in STX
});
```

### Custom Network URLs
```typescript
const agent = new StacksWalletAgent({
  network: {
    network: 'testnet',
    coreApiUrl: 'https://your-custom-api.com',
    broadcastApiUrl: 'https://your-custom-broadcast.com',
  }
});
```

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
