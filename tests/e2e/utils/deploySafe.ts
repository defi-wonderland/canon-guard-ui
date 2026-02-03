import { createPublicClient, createWalletClient, http, type Address, type Hash, encodeFunctionData, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import { safeAbi } from "~/abis/safe";
import { safeProxyFactoryAbi } from "~/abis/safeProxyFactory";
import { zeroAddress } from "~/utils";
import { ANVIL_PRIVATE_KEY, ANVIL_RPC_URL, SAFE_ADDRESSES } from "../constants";

/**
 * Configuration for deploying a Safe
 */
export interface DeploySafeOptions {
  /** RPC URL for the Anvil fork (default: http://127.0.0.1:8545) */
  rpcUrl?: string;
  /** Owner addresses for the Safe (default: derived from ownerPrivateKey or [Anvil account 0]) */
  owners?: Address[];
  /** Multisig threshold (default: 1) */
  threshold?: number;
  /** Salt nonce for deterministic deployment (default: timestamp) */
  saltNonce?: bigint;
  /** Private key for the deployer/owner account (default: Anvil account 0) */
  ownerPrivateKey?: Hex;
}

/**
 * Result of Safe deployment
 */
export interface DeploySafeResult {
  /** Deployed Safe contract address */
  safeAddress: Address;
  /** Transaction hash of the deployment */
  transactionHash: Hash;
  /** Owner addresses */
  owners: Address[];
  /** Multisig threshold */
  threshold: number;
}

/**
 * Deploy a new Safe wallet on the Anvil fork
 *
 * This function replicates the behavior of scripts/create-safe.sh but uses
 * viem for all blockchain interactions. It:
 * 1. Creates wallet and public clients for Anvil
 * 2. Encodes Safe setup data
 * 3. Simulates SafeProxyFactory.createProxyWithNonce() to get the Safe address
 * 4. Executes the deployment transaction
 * 5. Verifies deployment by reading owners and threshold
 *
 * @param options - Deployment configuration
 * @returns Deployed Safe information
 *
 * @example
 * ```typescript
 * const { safeAddress } = await deploySafe({
 *   owners: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
 *   threshold: 1,
 * });
 * ```
 */
export async function deploySafe(options: DeploySafeOptions = {}): Promise<DeploySafeResult> {
  const {
    rpcUrl = ANVIL_RPC_URL,
    owners: providedOwners,
    threshold = 1,
    saltNonce = BigInt(Date.now()),
    ownerPrivateKey = ANVIL_PRIVATE_KEY,
  } = options;

  // Step 1: Create clients
  const account = privateKeyToAccount(ownerPrivateKey);

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: optimism,
    transport: http(rpcUrl),
  });

  // Step 2: Determine owners
  // If owners are provided, use them. Otherwise, use the account derived from ownerPrivateKey.
  let owners: Address[];
  if (providedOwners && providedOwners.length > 0) {
    owners = providedOwners;
  } else {
    // Use the account address derived from the private key as the owner
    owners = [account.address];
  }

  // Step 3: Encode Safe setup initializer
  // setup(address[],uint256,address,bytes,address,address,uint256,address)
  const setupData = encodeFunctionData({
    abi: safeAbi,
    functionName: "setup",
    args: [
      owners, // _owners
      BigInt(threshold), // _threshold
      zeroAddress, // to (no delegate call)
      "0x" as Hex, // data (empty)
      SAFE_ADDRESSES.FALLBACK_HANDLER, // fallbackHandler
      zeroAddress, // paymentToken (native)
      0n, // payment
      zeroAddress, // paymentReceiver
    ],
  });

  // Step 4: Simulate the call to get the predicted Safe address
  const { result: safeAddress, request } = await publicClient.simulateContract({
    address: SAFE_ADDRESSES.SAFE_PROXY_FACTORY,
    abi: safeProxyFactoryAbi,
    functionName: "createProxyWithNonce",
    args: [SAFE_ADDRESSES.SAFE_SINGLETON, setupData, saltNonce],
    account,
  });

  // Step 5: Execute the deployment transaction
  const hash = await walletClient.writeContract(request);

  // Step 6: Wait for transaction confirmation
  await publicClient.waitForTransactionReceipt({ hash });

  // Step 7: Verify deployment by reading Safe data
  const [deployedOwners, deployedThreshold] = await Promise.all([
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "getOwners",
    }),
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "getThreshold",
    }),
  ]);

  // Verification checks
  if (deployedOwners.length !== owners.length) {
    throw new Error(`Owner count mismatch: expected ${owners.length}, got ${deployedOwners.length}`);
  }

  if (Number(deployedThreshold) !== threshold) {
    throw new Error(`Threshold mismatch: expected ${threshold}, got ${deployedThreshold}`);
  }

  return {
    safeAddress,
    transactionHash: hash,
    owners: deployedOwners as Address[],
    threshold: Number(deployedThreshold),
  };
}
