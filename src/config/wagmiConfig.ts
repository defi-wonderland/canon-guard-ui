import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { rainbowWallet, walletConnectWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { mainnet, optimism } from "wagmi/chains";
import { getConfig } from "~/config";
import { SUPPORTED_CHAINS, SupportedChainId } from "~/config/chains";
import { e2eWallet } from "./e2eConnector";

const { PROJECT_ID, IS_PLAYWRIGHT } = getConfig().env;

const getWallets = () => {
  if (IS_PLAYWRIGHT) {
    return [e2eWallet];
  }

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
  ssr: false, // Client-side only app
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: IS_PLAYWRIGHT
      ? http("http://127.0.0.1:8546")
      : http(SUPPORTED_CHAINS[SupportedChainId.ETHEREUM].rpcUrl),
    [optimism.id]: IS_PLAYWRIGHT
      ? http("http://127.0.0.1:8545")
      : http(SUPPORTED_CHAINS[SupportedChainId.OPTIMISM].rpcUrl),
  },
  batch: { multicall: true },
  connectors,
});
