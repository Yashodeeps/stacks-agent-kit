import { StacksWalletAgent } from '../agents/wallet-agent';

// Factory function for easy agent creation
export async function createStacksWalletAgent(config: {
  network: 'mainnet' | 'testnet';
  coreApiUrl?: string;
  broadcastApiUrl?: string;
  defaultFee?: string;
  privateKey?: string;
  model?: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
}) {
  const agent = new StacksWalletAgent({
    network: {
      network: config.network,
      coreApiUrl: config.coreApiUrl,
      broadcastApiUrl: config.broadcastApiUrl,
    },
    defaultFee: config.defaultFee,
    privateKey: config.privateKey,
    model: config.model,
    openAiApiKey: config.openAiApiKey,
    anthropicApiKey: config.anthropicApiKey,
  });
  
  await agent.init();
  return agent;
}
