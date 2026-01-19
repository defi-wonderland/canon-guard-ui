import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
  encodeFunctionData,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';
import { safeAbi } from '../../src/abis/safe';
import { safeProxyFactoryAbi } from '../../src/abis/safeProxyFactory';

/**
 * Safe v1.4.1 deployment addresses (same across all EVM chains)
 */
export const SAFE_ADDRESSES = {
  SAFE_PROXY_FACTORY: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67' as Address,
  SAFE_SINGLETON: '0x41675C099F32341bf84BFc5382aF534df5C7461a' as Address,
  FALLBACK_HANDLER: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' as Address,
} as const;

/**
 * Anvil's well-known private key for account 0
 * Public address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 */
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

/**
 * Configuration for deploying a Safe
 */
export interface DeploySafeOptions {
  /** RPC URL for the Anvil fork (default: http://127.0.0.1:8545) */
  rpcUrl?: string;
  /** Owner addresses for the Safe (default: [Anvil account 0]) */
  owners?: Address[];
  /** Multisig threshold (default: 1) */
  threshold?: number;
  /** Salt nonce for deterministic deployment (default: timestamp) */
  saltNonce?: bigint;
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
    rpcUrl = 'http://127.0.0.1:8545',
    owners: providedOwners,
    threshold = 1,
    saltNonce = BigInt(Date.now()),
  } = options;

  // Step 1: Create clients
  const account = privateKeyToAccount(ANVIL_PRIVATE_KEY);

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: optimism,
    transport: http(rpcUrl),
  });

  // Step 2: Determine owners (fetch from Anvil if not provided)
  let owners: Address[];
  if (providedOwners && providedOwners.length > 0) {
    owners = providedOwners;
  } else {
    // Fetch accounts from Anvil
    const accounts = await publicClient.request({
      method: 'eth_accounts',
      params: [],
    });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available from Anvil');
    }
    owners = [accounts[0] as Address];
  }

  // Step 3: Encode Safe setup initializer
  // setup(address[],uint256,address,bytes,address,address,uint256,address)
  const setupData = encodeFunctionData({
    abi: safeAbi,
    functionName: 'setup',
    args: [
      owners, // _owners
      BigInt(threshold), // _threshold
      '0x0000000000000000000000000000000000000000' as Address, // to (no delegate call)
      '0x' as `0x${string}`, // data (empty)
      SAFE_ADDRESSES.FALLBACK_HANDLER, // fallbackHandler
      '0x0000000000000000000000000000000000000000' as Address, // paymentToken (native)
      0n, // payment
      '0x0000000000000000000000000000000000000000' as Address, // paymentReceiver
    ],
  });

  // Step 4: Simulate the call to get the predicted Safe address
  const { result: safeAddress, request } = await publicClient.simulateContract({
    address: SAFE_ADDRESSES.SAFE_PROXY_FACTORY,
    abi: safeProxyFactoryAbi,
    functionName: 'createProxyWithNonce',
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
      functionName: 'getOwners',
    }),
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: 'getThreshold',
    }),
  ]);

  // Verification checks
  if (deployedOwners.length !== owners.length) {
    throw new Error(
      `Owner count mismatch: expected ${owners.length}, got ${deployedOwners.length}`
    );
  }

  if (Number(deployedThreshold) !== threshold) {
    throw new Error(
      `Threshold mismatch: expected ${threshold}, got ${deployedThreshold}`
    );
  }

  return {
    safeAddress,
    transactionHash: hash,
    owners: deployedOwners,
    threshold: Number(deployedThreshold),
  };
}
