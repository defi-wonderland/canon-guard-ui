import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useConfig } from "wagmi";
import { readContracts } from "wagmi/actions";
import { canonGuardAbi } from "~/abis/canonGuard";
import { useStateContext } from "~/hooks/useStateContext";
import type { Address } from "viem";

export interface CanonGuardConfigState {
  shortTxExecutionDelay: bigint | null;
  longTxExecutionDelay: bigint | null;
  txExpiryDelay: bigint | null;
  maxApprovalDuration: bigint | null;
  emergencyMode: boolean | null;
  emergencyTrigger: Address | null;
  emergencyCaller: Address | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const defaultState: CanonGuardConfigState = {
  shortTxExecutionDelay: null,
  longTxExecutionDelay: null,
  txExpiryDelay: null,
  maxApprovalDuration: null,
  emergencyMode: null,
  emergencyTrigger: null,
  emergencyCaller: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
};

const CanonGuardConfigContext = createContext<CanonGuardConfigState>(defaultState);

interface CanonGuardConfigProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages Canon Guard configuration state.
 * Wraps the app to provide a single source of truth for all config values.
 */
export const CanonGuardConfigProvider = ({ children }: CanonGuardConfigProviderProps) => {
  const config = useConfig();
  const { guardAddress, chainId } = useStateContext();

  const [shortTxExecutionDelay, setShortTxExecutionDelay] = useState<bigint | null>(null);
  const [longTxExecutionDelay, setLongTxExecutionDelay] = useState<bigint | null>(null);
  const [txExpiryDelay, setTxExpiryDelay] = useState<bigint | null>(null);
  const [maxApprovalDuration, setMaxApprovalDuration] = useState<bigint | null>(null);
  const [emergencyMode, setEmergencyMode] = useState<boolean | null>(null);
  const [emergencyTrigger, setEmergencyTrigger] = useState<Address | null>(null);
  const [emergencyCaller, setEmergencyCaller] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!guardAddress || !chainId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await readContracts(config, {
        contracts: [
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "SHORT_TX_EXECUTION_DELAY",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "LONG_TX_EXECUTION_DELAY",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "TX_EXPIRY_DELAY",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "MAX_APPROVAL_DURATION",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "emergencyMode",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "emergencyTrigger",
            chainId,
          },
          {
            address: guardAddress as Address,
            abi: canonGuardAbi,
            functionName: "emergencyCaller",
            chainId,
          },
        ],
      });

      const [
        shortDelayResult,
        longDelayResult,
        expiryResult,
        maxApprovalResult,
        emergencyResult,
        triggerResult,
        callerResult,
      ] = results;

      if (shortDelayResult.status === "success") {
        setShortTxExecutionDelay(shortDelayResult.result as bigint);
      }
      if (longDelayResult.status === "success") {
        setLongTxExecutionDelay(longDelayResult.result as bigint);
      }
      if (expiryResult.status === "success") {
        setTxExpiryDelay(expiryResult.result as bigint);
      }
      if (maxApprovalResult.status === "success") {
        setMaxApprovalDuration(maxApprovalResult.result as bigint);
      }
      if (emergencyResult.status === "success") {
        setEmergencyMode(emergencyResult.result as boolean);
      }
      if (triggerResult.status === "success") {
        setEmergencyTrigger(triggerResult.result as Address);
      }
      if (callerResult.status === "success") {
        setEmergencyCaller(callerResult.result as Address);
      }
    } catch (err) {
      console.error("[CanonGuardConfigContext] Failed to fetch config:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch config"));
    } finally {
      setIsLoading(false);
    }
  }, [config, guardAddress, chainId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value: CanonGuardConfigState = {
    shortTxExecutionDelay,
    longTxExecutionDelay,
    txExpiryDelay,
    maxApprovalDuration,
    emergencyMode,
    emergencyTrigger,
    emergencyCaller,
    isLoading,
    error,
    refetch: fetchConfig,
  };

  return <CanonGuardConfigContext.Provider value={value}>{children}</CanonGuardConfigContext.Provider>;
};

/**
 * Hook to consume Canon Guard configuration from context.
 * All components using this hook share the same state instance.
 */
export const useCanonGuardConfigContext = (): CanonGuardConfigState => {
  const context = useContext(CanonGuardConfigContext);
  if (context === undefined) {
    throw new Error("useCanonGuardConfigContext must be used within a CanonGuardConfigProvider");
  }
  return context;
};
