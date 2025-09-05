import { createContext, useState } from "react";
import { Address } from "viem";
import { optimism } from "viem/chains";
import { OPTIMISM_MAINNET_RPC } from "../constants/addresses";
import { ClientService, SafeService, CanonGuardService } from "../services";

interface ServiceInstances {
  clientService: ClientService;
  safeService: SafeService;
  canonGuardService: CanonGuardService;
}

const createServiceInstances = (rpcUrl: string = OPTIMISM_MAINNET_RPC): ServiceInstances => {
  const clientService = new ClientService(rpcUrl, optimism);
  const safeService = new SafeService(clientService);
  const canonGuardService = new CanonGuardService(clientService);

  return {
    clientService,
    safeService,
    canonGuardService,
  };
};

const initialServices = createServiceInstances();

type ContextType = {
  isError: boolean;
  setIsError: (val: boolean) => void;

  vaultAddress: Address | null;
  setVaultAddress: (address: Address) => void;

  rpcUrl: string | null;
  setRpcUrl: (url: string) => void;
  services: ServiceInstances;

  clearVaultConfig: () => void;
};

interface StateProps {
  children: React.ReactElement;
}

export const StateContext = createContext({} as ContextType);

export const StateProvider = ({ children }: StateProps) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [vaultAddress, setVaultAddressState] = useState<Address | null>(null);
  const [rpcUrl, setRpcUrlState] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceInstances>(initialServices);

  const updateServicesRpcUrl = (newRpcUrl: string) => {
    const newServices = createServiceInstances(newRpcUrl);
    setServices(newServices);
  };

  const setVaultAddress = (address: Address) => {
    setVaultAddressState(address);
  };

  const setRpcUrl = (url: string) => {
    setRpcUrlState(url);
    updateServicesRpcUrl(url);
  };

  const clearVaultConfig = () => {
    setVaultAddressState(null);
    setRpcUrlState(null);
  };

  return (
    <StateContext.Provider
      value={{
        isError,
        setIsError,
        vaultAddress,
        setVaultAddress,
        rpcUrl,
        setRpcUrl,
        services,
        clearVaultConfig,
      }}
    >
      <>{children}</>
    </StateContext.Provider>
  );
};
