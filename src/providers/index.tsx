import type { ReactNode } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "~/router";
import { StateProvider } from "./StateProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WalletProvider } from "./WalletProvider";

type Props = {
  children?: ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <StateProvider>
        <WalletProvider>
          <RouterProvider router={router} />
          {children}
        </WalletProvider>
      </StateProvider>
    </ThemeProvider>
  );
};
