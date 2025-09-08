# 🚀 Stacks Agent Kit

A comprehensive TypeScript SDK for building AI agents that interact with the Stacks blockchain. This kit provides powerful tools for wallet management, smart contract deployment & interaction, multi-signature transactions, sponsored transactions, and more - all integrated with AI capabilities for natural language blockchain operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Stacks](https://img.shields.io/badge/Stacks-5546FF?logo=stacks&logoColor=white)](https://stacks.org/)

## 🌟 Features

- **🔍 Wallet Operations**: Query balances, transaction history, and account information
- **💸 STX Transfers**: Send STX tokens with validation and fee estimation  
- **📝 Smart Contract Deployment**: Deploy Clarity contracts to the blockchain
- **⚡ Contract Interactions**: Call contract functions and query read-only functions
- **🔐 Key Management**: Generate, import, and validate private keys and addresses
- **👥 Multi-Signature Support**: Create and manage multi-sig transactions
- **💰 Sponsored Transactions**: Enable fee-less transactions for users
- **🔄 Token Swapping**: Exchange STX for other tokens via DEX protocols
- **🤖 AI-Powered Tool Matching**: Use natural language prompts to execute blockchain operations
- **📊 LangGraph Integration**: Build complex workflows using state graphs
- **🛡️ TypeScript Support**: Full type safety and IntelliSense support
- **🌐 Network Flexibility**: Support for both mainnet and testnet
- **🧠 Multiple AI Providers**: Support for OpenAI and Anthropic models

## 📦 Installation

```bash
npm install stacks-agent-kit
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createStacksWalletAgent } from 'stacks-agent-kit';

// Create an agent for testnet
const agent = createStacksWalletAgent({
  network: 'testnet',
});

// Get available tools
const tools = agent.getTools();

// Query a wallet
const walletInfo = await tools.find(t => t.name === 'query_wallet').execute({
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  includeTransactions: true,
  limit: 5
});

console.log(walletInfo);
```

### AI-Powered Agent Usage

```typescript
import { createStacksWalletAgent } from 'stacks-agent-kit';

// Create an AI-powered agent with private key initialization
const agent = createStacksWalletAgent({
  privateKey: 'your-private-key-here', // Optional: Initialize with a private key
  network: 'testnet',
  model: 'gpt-4o-mini', // Optional: Default is 'gpt-4o-mini'
  openAiApiKey: process.env.OPENAI_API_KEY,
});

// Use natural language to execute blockchain operations
const result = await agent.executePrompt(
  'What is the balance of wallet address SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7?'
);

// Transfer STX using natural language
const transferResult = await agent.executePrompt(
  'Transfer 0.1 STX to SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 with memo "Payment for services"'
);
```

## 🛠️ Available Tools

The Stacks Agent Kit provides 9+ comprehensive tools organized into categories:

### 🔍 **Wallet & Balance Tools**
- **Query Wallet**: Get comprehensive wallet information including balance and transaction history
- **Get Balance**: Get the STX balance of a specific wallet address

### 💸 **STX Transfer Tools**
- **Transfer STX**: Transfer STX tokens between wallets
- **Estimate Transfer Fee**: Estimate fees for STX transfers
- **Validate Transfer**: Validate transfer parameters before execution

### 📝 **Smart Contract Tools**
- **Deploy Contract**: Deploy Clarity smart contracts to the blockchain
- **Call Contract**: Execute state-changing contract functions
- **Read-Only Call**: Query contract state without transactions
- **Get Contract ABI**: Retrieve contract interface definitions

### 🔐 **Key Management Tools**
- **Generate Key**: Create new private/public key pairs
- **Import Key**: Import existing private keys
- **Validate Address**: Validate Stacks address formats

### 👥 **Multi-Signature Tools**
- **Create Multi-Sig**: Create multi-signature transactions
- **Sign Multi-Sig**: Sign multi-signature transactions

### 💰 **Sponsored Transaction Tools**
- **Create Sponsored TX**: Create fee-less transactions
- **Sponsor Transaction**: Pay fees for other users' transactions

### 🔄 **Token Swapping Tools**
- **Swap Tokens**: Exchange STX for other tokens via DEX protocols

## 📁 Project Structure

```
stacks-agent-kit/
├── nodejs/                    # Core SDK package
│   ├── src/
│   │   ├── agents/           # AI agent implementations
│   │   ├── tools/            # Blockchain interaction tools
│   │   ├── core/             # Core functionality
│   │   └── utils/            # Utility functions
│   └── package.json
├── examples/
│   ├── among-us/             # Interactive AI Among Us game
│   └── nodejs/               # Basic Node.js examples
└── README.md
```

## 🎮 Example Applications

### Among Us: AI Agent Edition

An interactive web application demonstrating the power of AI agents in a social deduction game context:

- **Location**: `examples/among-us/`
- **Technology**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Features**:
  - AI agents with unique personalities play Among Us
  - Real STX betting system on testnet
  - Interactive gameplay with voting and elimination
  - Beautiful animated UI with real-time game log
  - Automatic payout system for winners

#### Running the Among Us Example

```bash
cd examples/among-us
npm install
npm run dev
```

**Game Features**:
- 🎭 Choose from 6 unique AI personalities (Detective Dave, Nervous Nancy, etc.)
- 💰 Bet STX on whether the crew can identify the impostor
- 🤖 Watch AI agents interact, discuss, and vote strategically
- 🏆 Win 1.8x your bet if the crew successfully identifies the impostor
- 📊 Real-time suspicion tracking and voting mechanics
- 🔄 Automatic blockchain transactions for bets and payouts

### Node.js Examples

Basic examples demonstrating SDK functionality:

- **Location**: `examples/nodejs/`
- **Features**: Simple tool usage examples and testing scripts

## 🔧 Configuration Options

```typescript
interface AgentConfig {
  privateKey?: string;           // Optional: Initialize with a private key
  network: 'mainnet' | 'testnet'; // Required: Network to use
  coreApiUrl?: string;           // Optional: Custom core API URL
  broadcastApiUrl?: string;      // Optional: Custom broadcast API URL
  model?: string;                // Optional: AI model to use
  openAiApiKey?: string;         // Optional: OpenAI API key
  anthropicApiKey?: string;      // Optional: Anthropic API key
  defaultFee?: string;           // Optional: Default transaction fee
}
```

## 🤖 AI Integration

The SDK supports multiple AI providers and models:

### OpenAI Models
- `gpt-4o-mini` (default)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

### Anthropic Models
- `claude-3-5-sonnet-20241022` (latest)
- `claude-3-5-haiku-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### Natural Language Examples

```typescript
// Smart contract operations
await agent.executePrompt("Deploy a counter contract with increment function");
await agent.executePrompt("Call increment on contract ST123...counter");

// Wallet operations
await agent.executePrompt("Check balance of ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
await agent.executePrompt("Send 1.5 STX to ST123... with memo 'Payment'");

// Key management
await agent.executePrompt("Generate a new testnet wallet address");
await agent.executePrompt("Validate address ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
```

## 🔒 Security Best Practices

- **🔐 Private Keys**: Never hardcode private keys. Use environment variables
- **🌐 Network Selection**: Always use testnet for development and testing
- **✅ Validation**: Validate all transfers before execution
- **💰 Fee Estimation**: Use fee estimation to ensure sufficient balance
- **🔍 Contract Verification**: Verify contract source before interaction
- **👥 Multi-Sig**: Use multi-signature wallets for high-value operations

## 🚀 Getting Started with Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Yashodeeps/stacks-agent-kit.git
   cd stacks-agent-kit
   ```

2. **Install dependencies**:
   ```bash
   cd nodejs
   npm install
   ```

3. **Build the SDK**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm run tools-test
   npm run transfer-test
   ```

5. **Try the Among Us example**:
   ```bash
   cd ../examples/among-us
   npm install
   npm run dev
   ```

## 🌐 Environment Setup

Create a `.env` file in your project root:

```bash
# Stacks Configuration
STACKS_PRIVATE_KEY=your_private_key_here
STACKS_WALLET_ADDRESS=your_wallet_address_here
STACKS_NETWORK=testnet

# AI Configuration
OPENAI_API_KEY=your_openai_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_key_here
```

## 📚 Documentation

For detailed documentation on each tool and advanced usage patterns, see the [nodejs SDK README](./nodejs/README.md).

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Stacks Documentation](https://docs.stacks.org/)
- [Clarity Language Reference](https://docs.stacks.org/clarity/)
- [Stacks.js Documentation](https://stacks.js.org/)
- [OpenAI API](https://platform.openai.com/)
- [Anthropic API](https://www.anthropic.com/)

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub!
