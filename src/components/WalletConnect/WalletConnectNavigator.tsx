/**
 * WalletConnect Navigator
 * Watches for pending transactions and navigates to the Arbitrary Action form
 * Must be rendered inside the Router context
 */

import { useEffect } from "react";
import { useNavigateWithParams } from "~/hooks";
import { useWalletConnect } from "~/providers/WalletConnectProvider";

export const WalletConnectNavigator = () => {
  const { pendingTransaction, clearPendingTransaction } = useWalletConnect();
  const navigateWithParams = useNavigateWithParams();

  useEffect(() => {
    if (pendingTransaction) {
      // Navigate to the arbitrary action form with prefilled data
      navigateWithParams("/create/action/arbitrary-action", {
        state: {
          walletConnectTx: pendingTransaction,
        },
      });

      // Clear the pending transaction so we don't navigate again
      clearPendingTransaction();
    }
  }, [pendingTransaction, navigateWithParams, clearPendingTransaction]);

  // This component doesn't render anything
  return null;
};
