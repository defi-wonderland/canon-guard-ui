import { createContext, useState } from "react";
import { Address } from "viem";
import { SupportedChainId, DEFAULT_CHAIN_ID, getRpcUrlForChain, getViemChain } from "~/config/chains";
import { ClientService, SafeService, CanonGuardService, QueueService } from "../services";

interface ServiceInstances {
  clientService: ClientService;
  safeService: SafeService;
  canonGuardService: CanonGuardService;
  queueService: QueueService;
}

const createServiceInstances = (chainId: SupportedChainId): ServiceInstances => {
  const rpcUrl = getRpcUrlForChain(chainId);
  const chain = getViemChain(chainId);

  const clientService = new ClientService(rpcUrl, chain);
  const safeService = new SafeService(clientService);
  const canonGuardService = new CanonGuardService(clientService);
  const queueService = new QueueService(clientService);

  return {
    clientService,
    safeService,
    canonGuardService,
    queueService,
  };
};

const initialServices = createServiceInstances(DEFAULT_CHAIN_ID);

type ContextType = {
  isError: boolean;
  setIsError: (val: boolean) => void;

  safeAddress: Address | null;
  setSafeAddress: (address: Address) => void;

  guardAddress: Address | null;
  setGuardAddress: (address: Address) => void;

  // Whether the Canon Guard is in detached mode (not attached to the Safe)
  isDetached: boolean;
  setIsDetached: (val: boolean) => void;

  chainId: SupportedChainId | null;
  setChainId: (chainId: SupportedChainId) => void;

  services: ServiceInstances;

  clearConfig: () => void;
};

interface StateProps {
  children: React.ReactElement;
}

// eslint-disable-next-line react-refresh/only-export-components
export const StateContext = createContext({} as ContextType);

export const StateProvider = ({ children }: StateProps) => {
  const [isError, setIsError] = useState<boolean>(false);
  const [safeAddress, setSafeAddressState] = useState<Address | null>(null);
  const [guardAddress, setGuardAddressState] = useState<Address | null>(null);
  const [isDetached, setIsDetachedState] = useState<boolean>(false);
  const [chainId, setChainIdState] = useState<SupportedChainId | null>(null);
  const [services, setServices] = useState<ServiceInstances>(initialServices);

  const updateServicesForChain = (newChainId: SupportedChainId) => {
    const newServices = createServiceInstances(newChainId);
    setServices(newServices);
  };

  const setSafeAddress = (address: Address) => {
    setSafeAddressState(address);
  };

  const setGuardAddress = (address: Address) => {
    setGuardAddressState(address);
  };

  const setIsDetached = (val: boolean) => {
    setIsDetachedState(val);
  };

  const setChainId = (newChainId: SupportedChainId) => {
    setChainIdState(newChainId);
    updateServicesForChain(newChainId);
  };

  const clearConfig = () => {
    setSafeAddressState(null);
    setGuardAddressState(null);
    setIsDetachedState(false);
    setChainIdState(null);
  };

  return (
    <StateContext.Provider
      value={{
        isError,
        setIsError,
        safeAddress,
        setSafeAddress,
        guardAddress,
        setGuardAddress,
        isDetached,
        setIsDetached,
        chainId,
        setChainId,
        services,
        clearConfig,
      }}
    >
      <>{children}</>
    </StateContext.Provider>
  );
};
