import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { rainbowWallet, walletConnectWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getConfig } from "~/config";

const { PROJECT_ID, ALCHEMY_KEY, IS_PLAYWRIGHT } = getConfig().env;
const { RPC_URL_TESTING } = getConfig().constants;

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
    appName: "Web3 React boilerplate",
    projectId: PROJECT_ID,
  },
);

export const config = createConfig({
  chains: [sepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [sepolia.id]: IS_PLAYWRIGHT ? http(RPC_URL_TESTING) : ALCHEMY_KEY ? http(ALCHEMY_KEY) : http(),
  },
  batch: { multicall: true },
  connectors,
});
