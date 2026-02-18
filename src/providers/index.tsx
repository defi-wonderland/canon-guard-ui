import type { ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import { WalletConnectModal } from "~/components/WalletConnect";
import { router } from "~/router";
import { StateProvider } from "./StateProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";
import { WalletConnectProvider } from "./WalletConnectProvider";
import { WalletProvider } from "./WalletProvider";

type Props = {
  children?: ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <StateProvider>
        <WalletProvider>
          <WalletConnectProvider>
            <ToastProvider>
              <RouterProvider router={router} />
              <WalletConnectModal />
              {children}
            </ToastProvider>
          </WalletConnectProvider>
        </WalletProvider>
      </StateProvider>
    </ThemeProvider>
  );
};
