import { createContext, useState } from "react";
import { Address } from "viem";

type ContextType = {
  loading: boolean;
  setLoading: (val: boolean) => void;

  isError: boolean;
  setIsError: (val: boolean) => void;

  vaultAddress: Address | null;
  setVaultAddress: (address: Address) => void;

  rpcUrl: string | null;
  setRpcUrl: (url: string) => void;

  isVaultConfigured: boolean;

  clearVaultConfig: () => void;
};

interface StateProps {
  children: React.ReactElement;
}

export const StateContext = createContext({} as ContextType);

export const StateProvider = ({ children }: StateProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [vaultAddress, setVaultAddressState] = useState<Address | null>(null);
  const [rpcUrl, setRpcUrlState] = useState<string | null>(null);

  const setVaultAddress = (address: Address) => {
    setVaultAddressState(address);
  };

  const setRpcUrl = (url: string) => {
    setRpcUrlState(url);
  };

  const isVaultConfigured = Boolean(vaultAddress && rpcUrl);

  const clearVaultConfig = () => {
    setVaultAddressState(null);
    setRpcUrlState(null);
  };

  return (
    <StateContext.Provider
      value={{
        loading,
        setLoading,
        isError,
        setIsError,
        vaultAddress,
        setVaultAddress,
        rpcUrl,
        setRpcUrl,
        isVaultConfigured,
        clearVaultConfig,
      }}
    >
      <>{children}</>
    </StateContext.Provider>
  );
};
