import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { rainbowWallet, walletConnectWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, optimism } from "wagmi/chains";
import { getConfig } from "~/config";
import { SUPPORTED_CHAINS, SupportedChainId } from "~/config/chains";

const { PROJECT_ID } = getConfig().env;

const getWallets = () => {
  if (PROJECT_ID) {
    return [injectedWallet, rainbowWallet, walletConnectWallet];
  } else {
    return [injectedWallet];
  }
};

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: getWallets(),
    },
  ],
  {
    appName: "Canon Guard",
    projectId: PROJECT_ID,
  },
);

export const config = createConfig({
  chains: [mainnet, optimism],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: http(SUPPORTED_CHAINS[SupportedChainId.ETHEREUM].rpcUrl),
    [optimism.id]: http(SUPPORTED_CHAINS[SupportedChainId.OPTIMISM].rpcUrl),
  },
  batch: { multicall: true },
  connectors,
});
