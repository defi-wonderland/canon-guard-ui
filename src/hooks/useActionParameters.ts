import { useEffect, useState } from "react";
import { type Address, type Hex, erc20Abi, formatUnits } from "viem";
import {
  actionBuilderAbi,
  allowanceClaimorAbi,
  cappedTokenTransfersAbi,
  cappedTokenTransfersHubAbi,
  changeSafeGuardActionAbi,
  preApproveActionViewAbi,
  setEmergencyCallerActionAbi,
  setEmergencyTriggerActionAbi,
  simpleActionsViewAbi,
  transferActionsViewAbi,
} from "~/abis/canonGuard";
import { findTokenByAddress } from "~/constants/tokenList";
import { ActionFactoryType } from "~/types/canon-guard";
import { useClientService } from "./useServices";
import { useStateContext } from "./useStateContext";

// ---- Public types ----

export interface TransferParam {
  token: Address;
  recipient: Address;
  amount: bigint;
  symbol: string;
  decimals: number;
}

export interface ArbitraryActionParam {
  target: Address;
  signature: string;
  data: Hex;
  value: bigint;
}

export interface AllowanceClaimParam {
  token: Address;
  tokenOwner: Address;
  tokenRecipient: Address;
  symbol: string;
  decimals: number;
}

export interface CappedTransferParam {
  token: Address;
  recipient: Address;
  amount: bigint;
  formattedAmount: string;
  symbol: string;
  decimals: number;
}

export interface HubTokenParam {
  token: Address;
  symbol: string;
  decimals: number;
  cap: bigint;
  formattedCap: string;
  capLeft: bigint;
  formattedCapLeft: string;
  totalSpent: bigint;
  formattedTotalSpent: string;
}

export interface HubConfigParam {
  recipient: Address;
  epochLength: bigint;
  tokens: HubTokenParam[];
}

export interface PreApproveParam {
  actionsBuilder: Address;
  approvalDuration: bigint;
}

export interface ChangeSafeGuardParam {
  safeGuard: Address;
}

export interface EmergencyAddressParam {
  address: Address;
  role: "caller" | "trigger";
}

export interface ActionParametersData {
  type: ActionFactoryType;
  isHub?: boolean;
  transfers?: TransferParam[];
  arbitraryActions?: ArbitraryActionParam[];
  allowanceClaim?: AllowanceClaimParam;
  cappedTransfer?: CappedTransferParam;
  hubConfig?: HubConfigParam;
  preApprove?: PreApproveParam;
  changeSafeGuard?: ChangeSafeGuardParam;
  emergencyAddress?: EmergencyAddressParam;
}

interface UseActionParametersResult {
  data: ActionParametersData | null;
  isLoading: boolean;
  error: string | null;
}

// ---- Hook ----

/**
 * Fetches and decodes human-readable parameters for an action builder or hub contract.
 * Only fetches when the hook is mounted (i.e., when the Details tab is active).
 * All errors are handled gracefully -- on failure, returns null so technical details auto-open.
 */
export function useActionParameters(
  address: Address,
  factoryType: ActionFactoryType,
  isHub = false,
): UseActionParametersResult {
  const clientService = useClientService();
  const { chainId } = useStateContext();
  const [data, setData] = useState<ActionParametersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolvedChainId = chainId ?? 1;

    const fetchParams = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const client = clientService.getClient();
        let result: ActionParametersData | null = null;

        // Hub entities get hub-specific fetching
        if (isHub && factoryType === ActionFactoryType.CAPPED_TOKEN_TRANSFERS) {
          result = await fetchHubConfigParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.SIMPLE_TRANSFERS) {
          result = await fetchTransferParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.ARBITRARY_ACTIONS) {
          result = await fetchArbitraryParams(client, address);
        } else if (factoryType === ActionFactoryType.ALLOWANCE_CLAIMOR) {
          result = await fetchAllowanceClaimParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.CAPPED_TOKEN_TRANSFERS) {
          result = await fetchCappedTransferParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.APPROVE_ACTION) {
          result = await fetchPreApproveParams(client, address);
        } else if (factoryType === ActionFactoryType.CHANGE_SAFE_GUARD) {
          result = await fetchChangeSafeGuardParams(client, address);
        } else if (factoryType === ActionFactoryType.SET_EMERGENCY_CALLER) {
          result = await fetchEmergencyCallerParams(client, address);
        } else if (factoryType === ActionFactoryType.SET_EMERGENCY_TRIGGER) {
          result = await fetchEmergencyTriggerParams(client, address);
        }

        if (!cancelled) setData(result);
      } catch (err) {
        // Contract call may revert if the factory type classification is wrong or
        // the entity is a wrapper. Silently fall back to technical details.
        console.error("Failed to fetch action parameters:", err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchParams();
    return () => {
      cancelled = true;
    };
  }, [address, factoryType, clientService, chainId, isHub]);

  return { data, isLoading, error };
}

// ---- Helpers ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

async function fetchTokenMetadata(
  client: Client,
  tokenAddress: Address,
  chainId: number,
): Promise<{ symbol: string; decimals: number }> {
  const known = findTokenByAddress(tokenAddress, chainId);
  if (known) return { symbol: known.symbol, decimals: known.decimals };

  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
    ]);
    return { symbol: symbol as string, decimals: decimals as number };
  } catch {
    return { symbol: `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`, decimals: 18 };
  }
}

// ---- Fetch functions per factory type ----

async function fetchTransferParams(
  client: Client,
  actionAddress: Address,
  chainId: number,
): Promise<ActionParametersData> {
  const transferActions = (await client.readContract({
    address: actionAddress,
    abi: transferActionsViewAbi,
    functionName: "transferActions",
  })) as readonly { token: Address; to: Address; amount: bigint }[];

  const transfers: TransferParam[] = [];
  for (const action of transferActions) {
    const meta = await fetchTokenMetadata(client, action.token, chainId);
    transfers.push({
      token: action.token,
      recipient: action.to,
      amount: action.amount,
      symbol: meta.symbol,
      decimals: meta.decimals,
    });
  }

  return { type: ActionFactoryType.SIMPLE_TRANSFERS, transfers };
}

async function fetchArbitraryParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
  // Try simpleActions() first (newer contracts store the original constructor inputs)
  try {
    const simpleActions = (await client.readContract({
      address: actionAddress,
      abi: simpleActionsViewAbi,
      functionName: "simpleActions",
    })) as readonly { target: Address; signature: string; data: Hex; value: bigint }[];

    const arbitraryActions: ArbitraryActionParam[] = simpleActions.map((action) => ({
      target: action.target,
      signature: action.signature,
      data: action.data,
      value: action.value,
    }));

    return { type: ActionFactoryType.ARBITRARY_ACTIONS, arbitraryActions };
  } catch {
    // Fallback to getActions() for older contracts that don't have simpleActions()
    // getActions() returns Action[] {target, data (full calldata), value}
    const actions = (await client.readContract({
      address: actionAddress,
      abi: actionBuilderAbi,
      functionName: "getActions",
    })) as readonly { target: Address; data: Hex; value: bigint }[];

    const arbitraryActions: ArbitraryActionParam[] = actions.map((action) => ({
      target: action.target,
      signature: "", // No signature available from getActions()
      data: action.data,
      value: action.value,
    }));

    return { type: ActionFactoryType.ARBITRARY_ACTIONS, arbitraryActions };
  }
}

async function fetchAllowanceClaimParams(
  client: Client,
  actionAddress: Address,
  chainId: number,
): Promise<ActionParametersData> {
  const [token, tokenOwner, tokenRecipient] = await client.multicall({
    contracts: [
      { address: actionAddress, abi: allowanceClaimorAbi, functionName: "TOKEN" },
      { address: actionAddress, abi: allowanceClaimorAbi, functionName: "TOKEN_OWNER" },
      { address: actionAddress, abi: allowanceClaimorAbi, functionName: "TOKEN_RECIPIENT" },
    ],
    allowFailure: false,
  });

  const meta = await fetchTokenMetadata(client, token as Address, chainId);

  return {
    type: ActionFactoryType.ALLOWANCE_CLAIMOR,
    allowanceClaim: {
      token: token as Address,
      tokenOwner: tokenOwner as Address,
      tokenRecipient: tokenRecipient as Address,
      symbol: meta.symbol,
      decimals: meta.decimals,
    },
  };
}

async function fetchCappedTransferParams(
  client: Client,
  actionAddress: Address,
  chainId: number,
): Promise<ActionParametersData> {
  const [token, amount, recipient] = await client.multicall({
    contracts: [
      { address: actionAddress, abi: cappedTokenTransfersAbi, functionName: "TOKEN" },
      { address: actionAddress, abi: cappedTokenTransfersAbi, functionName: "AMOUNT" },
      { address: actionAddress, abi: cappedTokenTransfersAbi, functionName: "RECIPIENT" },
    ],
    allowFailure: false,
  });

  const meta = await fetchTokenMetadata(client, token as Address, chainId);
  const formattedAmount = formatUnits(amount as bigint, meta.decimals);

  return {
    type: ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
    cappedTransfer: {
      token: token as Address,
      recipient: recipient as Address,
      amount: amount as bigint,
      formattedAmount,
      symbol: meta.symbol,
      decimals: meta.decimals,
    },
  };
}

async function fetchHubConfigParams(
  client: Client,
  hubAddress: Address,
  chainId: number,
): Promise<ActionParametersData> {
  // Fetch hub-level info
  const [recipient, epochLength, tokenAddresses] = await client.multicall({
    contracts: [
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "RECIPIENT" },
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "EPOCH_LENGTH" },
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "tokens" },
    ],
    allowFailure: false,
  });

  const tokens = tokenAddresses as Address[];
  const hubTokens: HubTokenParam[] = [];

  if (tokens.length > 0) {
    // Batch fetch cap, capLeft, totalSpent for all tokens
    const tokenCalls = tokens.flatMap((token) => [
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "cap" as const, args: [token] },
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "capLeft" as const, args: [token] },
      { address: hubAddress, abi: cappedTokenTransfersHubAbi, functionName: "totalSpent" as const, args: [token] },
    ]);

    const tokenResults = await client.multicall({ contracts: tokenCalls, allowFailure: false });

    for (let i = 0; i < tokens.length; i++) {
      const tokenAddr = tokens[i];
      const cap = tokenResults[i * 3] as bigint;
      const capLeft = tokenResults[i * 3 + 1] as bigint;
      const totalSpent = tokenResults[i * 3 + 2] as bigint;

      const meta = await fetchTokenMetadata(client, tokenAddr, chainId);

      hubTokens.push({
        token: tokenAddr,
        symbol: meta.symbol,
        decimals: meta.decimals,
        cap,
        formattedCap: formatUnits(cap, meta.decimals),
        capLeft,
        formattedCapLeft: formatUnits(capLeft, meta.decimals),
        totalSpent,
        formattedTotalSpent: formatUnits(totalSpent, meta.decimals),
      });
    }
  }

  return {
    type: ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
    isHub: true,
    hubConfig: {
      recipient: recipient as Address,
      epochLength: epochLength as bigint,
      tokens: hubTokens,
    },
  };
}

async function fetchPreApproveParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
  const [actionsBuilder, approvalDuration] = await client.multicall({
    contracts: [
      { address: actionAddress, abi: preApproveActionViewAbi, functionName: "ACTIONS_BUILDER" },
      { address: actionAddress, abi: preApproveActionViewAbi, functionName: "APPROVAL_DURATION" },
    ],
    allowFailure: false,
  });

  return {
    type: ActionFactoryType.APPROVE_ACTION,
    preApprove: {
      actionsBuilder: actionsBuilder as Address,
      approvalDuration: approvalDuration as bigint,
    },
  };
}

async function fetchChangeSafeGuardParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
  const safeGuard = await client.readContract({
    address: actionAddress,
    abi: changeSafeGuardActionAbi,
    functionName: "SAFE_GUARD",
  });

  return {
    type: ActionFactoryType.CHANGE_SAFE_GUARD,
    changeSafeGuard: { safeGuard: safeGuard as Address },
  };
}

async function fetchEmergencyCallerParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
  const emergencyCaller = await client.readContract({
    address: actionAddress,
    abi: setEmergencyCallerActionAbi,
    functionName: "EMERGENCY_CALLER",
  });

  return {
    type: ActionFactoryType.SET_EMERGENCY_CALLER,
    emergencyAddress: { address: emergencyCaller as Address, role: "caller" },
  };
}

async function fetchEmergencyTriggerParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
  const emergencyTrigger = await client.readContract({
    address: actionAddress,
    abi: setEmergencyTriggerActionAbi,
    functionName: "EMERGENCY_TRIGGER",
  });

  return {
    type: ActionFactoryType.SET_EMERGENCY_TRIGGER,
    emergencyAddress: { address: emergencyTrigger as Address, role: "trigger" },
  };
}
