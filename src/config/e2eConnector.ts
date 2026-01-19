import { Wallet, WalletDetailsParams } from '@rainbow-me/rainbowkit';
import { e2eConnector as createE2EConnector } from '@wonderland/walletless';
import { createConnector } from 'wagmi';
import { mainnet, optimism } from 'wagmi/chains';
import { getEnv } from './env';

const { RPC_URL_TESTING } = getEnv();

export const e2eWallet = (): Wallet => ({
  id: 'e2e-test-wallet',
  name: 'E2E Test Wallet',
  iconUrl:
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2310b981" width="100" height="100" rx="20"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="white">E2E</text></svg>',
  iconBackground: '#10b981',
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) => {
    const connector = createE2EConnector({
      chains: [mainnet, optimism],
      rpcUrls: {
        [mainnet.id]: RPC_URL_TESTING,
        [optimism.id]: RPC_URL_TESTING,
      },
    });

    return createConnector((config) => ({
      ...connector(config),
      ...walletDetails,
    }));
  },
});
