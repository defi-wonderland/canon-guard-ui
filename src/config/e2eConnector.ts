/* eslint-disable */
// This file uses @wonderland/walletless which has package.json export issues
// that cause ESLint's import resolver to fail. Disabling ESLint for this file.
import { Wallet, WalletDetailsParams } from "@rainbow-me/rainbowkit";
import {
  createE2EProvider,
  e2eConnector as createE2EConnector,
  setSigningAccount,
  E2EProviderWithInternal,
} from "@wonderland/walletless";
import { createConnector } from "wagmi";
import { mainnet, optimism, sepolia } from "wagmi/chains";
import { TEST_RPC_URLS } from "./chains";

// Create an external provider so tests can control it via setSigningAccount
export const e2eProvider = createE2EProvider({
  chains: [mainnet, optimism, sepolia],
  rpcUrls: TEST_RPC_URLS,
});

// Expose provider globally for E2E tests to call setSigningAccount
// This allows tests to switch accounts using page.evaluate()
if (typeof window !== "undefined") {
  (window as typeof window & { __e2eTestProvider?: E2EProviderWithInternal }).__e2eTestProvider = e2eProvider;
}

// Export setSigningAccount for tests to use
export { setSigningAccount };

export const e2eWallet = (): Wallet => ({
  id: "e2e-test-wallet",
  name: "E2E Test Wallet",
  iconUrl:
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2310b981" width="100" height="100" rx="20"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="white">E2E</text></svg>',
  iconBackground: "#10b981",
  installed: true,
  createConnector: (walletDetails: WalletDetailsParams) => {
    // Pass the external provider so we can control it from tests
    const connector = createE2EConnector({
      provider: e2eProvider,
    });

    return createConnector((config) => ({
      ...connector(config),
      ...walletDetails,
    }));
  },
});
