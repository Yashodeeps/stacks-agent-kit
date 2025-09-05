import { StacksWalletAgent } from '../agents/wallet';

// Factory function for easy agent creation
export function createStacksWalletAgent(config: {
  network: 'mainnet' | 'testnet';
  coreApiUrl?: string;
  broadcastApiUrl?: string;
  defaultFee?: string;
}) {
  return new StacksWalletAgent({
    network: {
      network: config.network,
      coreApiUrl: config.coreApiUrl,
      broadcastApiUrl: config.broadcastApiUrl,
    },
    defaultFee: config.defaultFee,
  });
}
