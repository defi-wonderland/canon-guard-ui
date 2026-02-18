import { useEffect, useState } from "react";
import { type Address, type Hex, erc20Abi, formatUnits } from "viem";
import {
  allowanceClaimorAbi,
  cappedTokenTransfersAbi,
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

export interface ActionParametersData {
  type: ActionFactoryType;
  transfers?: TransferParam[];
  arbitraryActions?: ArbitraryActionParam[];
  allowanceClaim?: AllowanceClaimParam;
  cappedTransfer?: CappedTransferParam;
}

interface UseActionParametersResult {
  data: ActionParametersData | null;
  isLoading: boolean;
  error: string | null;
}

// ---- Hook ----

/**
 * Fetches and decodes human-readable parameters for an action builder contract.
 * Only fetches when the hook is mounted (i.e., when the Details tab is active).
 */
export function useActionParameters(address: Address, factoryType: ActionFactoryType): UseActionParametersResult {
  const clientService = useClientService();
  const { chainId } = useStateContext();
  const [data, setData] = useState<ActionParametersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch for supported factory types
    const supported = [
      ActionFactoryType.SIMPLE_TRANSFERS,
      ActionFactoryType.ARBITRARY_ACTIONS,
      ActionFactoryType.ALLOWANCE_CLAIMOR,
      ActionFactoryType.CAPPED_TOKEN_TRANSFERS,
    ];
    if (!supported.includes(factoryType)) {
      setData(null);
      return;
    }

    let cancelled = false;
    const resolvedChainId = chainId ?? 1;

    const fetchParams = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const client = clientService.getClient();
        let result: ActionParametersData | null = null;

        if (factoryType === ActionFactoryType.SIMPLE_TRANSFERS) {
          result = await fetchTransferParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.ARBITRARY_ACTIONS) {
          result = await fetchArbitraryParams(client, address);
        } else if (factoryType === ActionFactoryType.ALLOWANCE_CLAIMOR) {
          result = await fetchAllowanceClaimParams(client, address, resolvedChainId);
        } else if (factoryType === ActionFactoryType.CAPPED_TOKEN_TRANSFERS) {
          result = await fetchCappedTransferParams(client, address, resolvedChainId);
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch action parameters:", err);
        if (!cancelled) {
          setError("Failed to load action parameters");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchParams();
    return () => {
      cancelled = true;
    };
  }, [address, factoryType, clientService, chainId]);

  return { data, isLoading, error };
}

// ---- Fetch helpers ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

async function fetchTokenMetadata(
  client: Client,
  tokenAddress: Address,
  chainId: number,
): Promise<{ symbol: string; decimals: number }> {
  // Check static list first
  const known = findTokenByAddress(tokenAddress, chainId);
  if (known) {
    return { symbol: known.symbol, decimals: known.decimals };
  }

  // Fallback to onchain fetch
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
    ]);
    return { symbol: symbol as string, decimals: decimals as number };
  } catch {
    // If metadata fetch fails, return fallback
    return {
      symbol: `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
      decimals: 18,
    };
  }
}

/**
 * Fetch transfer parameters using SimpleTransfers.transferActions() view.
 * Returns TransferAction[] = { token: address, to: address, amount: uint256 }
 */
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

/**
 * Fetch arbitrary action parameters using SimpleActions.simpleActions() view.
 * Returns SimpleAction[] = { target: address, signature: string, data: bytes, value: uint256 }
 */
async function fetchArbitraryParams(client: Client, actionAddress: Address): Promise<ActionParametersData> {
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
}

/**
 * Fetch allowance claim parameters using AllowanceClaimor views.
 * Reads TOKEN(), TOKEN_OWNER(), TOKEN_RECIPIENT() immutable getters.
 */
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

/**
 * Fetch capped transfer parameters using CappedTokenTransfers views.
 * Reads TOKEN(), AMOUNT(), RECIPIENT() immutable getters.
 */
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
