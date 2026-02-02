import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  type Address,
  type Hash,
  encodeFunctionData,
} from "viem";
import { optimism } from "viem/chains";
import { ANVIL_RPC_URL, USDC_OPTIMISM, USDC_WHALE_OPTIMISM } from "../constants";

/**
 * ERC20 ABI for transfer function
 */
const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

/**
 * Options for funding a Safe with tokens
 */
export interface FundSafeOptions {
  /** RPC URL for the Anvil fork (default: http://127.0.0.1:8545) */
  rpcUrl?: string;
  /** Safe address to fund */
  safeAddress: Address;
  /** Token address (default: USDC on Optimism) */
  tokenAddress?: Address;
  /** Amount in human-readable format (e.g., "1000" for 1000 USDC) */
  amount: string;
  /** Whale address to impersonate (default: USDC whale on Optimism) */
  whaleAddress?: Address;
}

/**
 * Result of funding a Safe
 */
export interface FundSafeResult {
  /** Transaction hash of the transfer */
  transactionHash: Hash;
  /** Amount transferred (in token units) */
  amount: bigint;
  /** Token address */
  tokenAddress: Address;
  /** Safe address that received funds */
  safeAddress: Address;
}

/**
 * Fund a Safe with tokens by impersonating a whale account
 *
 * This function:
 * 1. Uses Anvil's impersonateAccount to act as the whale
 * 2. Transfers tokens from whale to the Safe
 * 3. Stops impersonation
 *
 * @param options - Funding configuration
 * @returns Funding result with transaction details
 *
 * @example
 * ```typescript
 * await fundSafe({
 *   safeAddress: '0x...',
 *   amount: '1000', // 1000 USDC
 * });
 * ```
 */
export async function fundSafe(options: FundSafeOptions): Promise<FundSafeResult> {
  const {
    rpcUrl = ANVIL_RPC_URL,
    safeAddress,
    tokenAddress = USDC_OPTIMISM,
    amount,
    whaleAddress = USDC_WHALE_OPTIMISM,
  } = options;

  // Create clients
  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    chain: optimism,
    transport: http(rpcUrl),
  });

  // Get token decimals
  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // Parse amount with correct decimals
  const amountInUnits = parseUnits(amount, decimals);

  // Check whale balance
  const whaleBalance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [whaleAddress],
  });

  if (whaleBalance < amountInUnits) {
    throw new Error(`Whale ${whaleAddress} has insufficient balance: ${whaleBalance} < ${amountInUnits}`);
  }

  // Step 1: Impersonate the whale account
  await publicClient.request({
    method: "anvil_impersonateAccount",
    params: [whaleAddress],
  });

  try {
    // Step 2: Encode the transfer call
    const transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [safeAddress, amountInUnits],
    });

    // Step 3: Send the transfer transaction as the whale
    const hash = await walletClient.sendTransaction({
      account: whaleAddress,
      to: tokenAddress,
      data: transferData,
      kzg: undefined,
      chain: undefined,
    });

    // Step 4: Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    // Verify the transfer
    const safeBalance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [safeAddress],
    });

    console.log(`[fundSafe] Transferred ${amount} tokens to Safe ${safeAddress}`);
    console.log(`[fundSafe] Safe balance: ${safeBalance}`);

    return {
      transactionHash: hash,
      amount: amountInUnits,
      tokenAddress,
      safeAddress,
    };
  } finally {
    // Step 5: Stop impersonation
    await publicClient.request({
      method: "anvil_stopImpersonatingAccount",
      params: [whaleAddress],
    });
  }
}
