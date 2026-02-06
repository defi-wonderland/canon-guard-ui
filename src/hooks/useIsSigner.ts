import { useStateContext } from "./useStateContext";
import { useWallet } from "./useWallet";

/**
 * Hook to check if the connected wallet is a signer of the current Safe.
 * Returns true if the connected wallet address is in the Safe owners list.
 */
export const useIsSigner = (): boolean => {
  const { safeOwners } = useStateContext();
  const { address: connectedAddress, isConnected } = useWallet();

  if (!isConnected || !connectedAddress || safeOwners.length === 0) {
    return false;
  }

  return safeOwners.some((owner) => owner.toLowerCase() === connectedAddress.toLowerCase());
};
