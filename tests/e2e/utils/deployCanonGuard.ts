import { createPublicClient, createWalletClient, http, type Address, type Hash, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import { getDeployFactory } from "~/config/canonGuardFactories";
import { MULTI_SEND_CALL_ONLY } from "~/constants/addresses";
import { ANVIL_ACCOUNT_ADDRESS, ANVIL_PRIVATE_KEY, ANVIL_RPC_URL, CANON_GUARD_CONFIG } from "../constants";

/**
 * Canon Guard Factory ABI for createCanonGuard function
 */
const canonGuardFactoryAbi = [
  {
    type: "function",
    name: "createCanonGuard",
    inputs: [
      { name: "_safe", type: "address" },
      { name: "_multiSendCallOnly", type: "address" },
      { name: "_shortTxExecutionDelay", type: "uint256" },
      { name: "_longTxExecutionDelay", type: "uint256" },
      { name: "_txExpiryDelay", type: "uint256" },
      { name: "_maxApprovalDuration", type: "uint256" },
      { name: "_emergencyTrigger", type: "address" },
      { name: "_emergencyCaller", type: "address" },
    ],
    outputs: [{ name: "_canonGuard", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CanonGuardCreated",
    inputs: [
      { name: "_canonGuard", type: "address", indexed: true },
      { name: "_safe", type: "address", indexed: true },
      { name: "_emergencyTrigger", type: "address", indexed: true },
      { name: "_emergencyCaller", type: "address", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "isChild",
    inputs: [{ name: "_canonGuard", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

/**
 * Configuration for deploying a Canon Guard
 */
export interface DeployCanonGuardOptions {
  /** RPC URL for the Anvil fork (default: http://127.0.0.1:8545) */
  rpcUrl?: string;
  /** The Safe address to protect with Canon Guard */
  safeAddress: Address;
  /** Short transaction execution delay in seconds (default: 3600 = 1 hour) */
  shortTxExecutionDelay?: bigint;
  /** Long transaction execution delay in seconds (default: 604800 = 7 days) */
  longTxExecutionDelay?: bigint;
  /** Transaction expiry delay in seconds (default: 604800 = 7 days) */
  txExpiryDelay?: bigint;
  /** Max approval duration in seconds (default: 10368000 = ~4 months) */
  maxApprovalDuration?: bigint;
  /** Emergency trigger address (default: deployer address) */
  emergencyTrigger?: Address;
  /** Emergency caller address (default: deployer address) */
  emergencyCaller?: Address;
  /** Private key for the deployer account */
  deployerPrivateKey?: `0x${string}`;
}

/**
 * Result of Canon Guard deployment
 */
export interface DeployCanonGuardResult {
  /** Deployed Canon Guard address */
  guardAddress: Address;
  /** Transaction hash of the deployment */
  transactionHash: Hash;
  /** The Safe this guard protects */
  safeAddress: Address;
  /** The factory that deployed this guard */
  factoryAddress: Address;
}

/**
 * Deploy a new Canon Guard on the Anvil fork
 *
 * This function deploys a Canon Guard by calling createCanonGuard directly on the factory.
 * The new factory allows anyone to deploy a Canon Guard for any Safe.
 *
 * Steps:
 * 1. Create clients
 * 2. Call createCanonGuard on the factory
 * 3. Parse CanonGuardCreated event from logs
 * 4. Verify deployment via factory.isChild()
 *
 * @param options - Deployment configuration
 * @returns Deployed Canon Guard information
 */
export async function deployCanonGuard(options: DeployCanonGuardOptions): Promise<DeployCanonGuardResult> {
  const {
    rpcUrl = ANVIL_RPC_URL,
    safeAddress,
    shortTxExecutionDelay = CANON_GUARD_CONFIG.shortTxExecutionDelay,
    longTxExecutionDelay = CANON_GUARD_CONFIG.longTxExecutionDelay,
    txExpiryDelay = CANON_GUARD_CONFIG.txExpiryDelay,
    maxApprovalDuration = CANON_GUARD_CONFIG.maxApprovalDuration,
    emergencyTrigger = ANVIL_ACCOUNT_ADDRESS, // Must be non-zero
    emergencyCaller = ANVIL_ACCOUNT_ADDRESS, // Must be non-zero
    deployerPrivateKey = ANVIL_PRIVATE_KEY,
  } = options;

  // Get the deploy factory
  const factory = getDeployFactory();
  if (!factory) {
    throw new Error("No deploy factory configured");
  }
  const factoryAddress = factory.address;

  // Step 1: Create clients
  const account = privateKeyToAccount(deployerPrivateKey);

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: optimism,
    transport: http(rpcUrl),
  });

  // Step 2: Call createCanonGuard directly on the factory
  // The new factory allows anyone to deploy a Canon Guard for any Safe
  const { request } = await publicClient.simulateContract({
    address: factoryAddress,
    abi: canonGuardFactoryAbi,
    functionName: "createCanonGuard",
    args: [
      safeAddress,
      MULTI_SEND_CALL_ONLY,
      shortTxExecutionDelay,
      longTxExecutionDelay,
      txExpiryDelay,
      maxApprovalDuration,
      emergencyTrigger,
      emergencyCaller,
    ],
    account,
  });

  const hash = await walletClient.writeContract(request);

  // Step 3: Wait for transaction confirmation and get receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Step 4: Parse the CanonGuardCreated event from logs
  // The factory emits an event with the guard address in topic[1]
  let guardAddress: Address | undefined;

  for (const log of receipt.logs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logData = log as any;

    // Check if this log is from the Canon Guard Factory
    if (logData.address?.toLowerCase() === factoryAddress.toLowerCase()) {
      // The guard address is in topic[1] (indexed parameter)
      if (logData.topics && logData.topics.length >= 2) {
        // Extract address from topic (last 20 bytes of 32-byte topic)
        const addressHex = "0x" + logData.topics[1].slice(-40);
        guardAddress = getAddress(addressHex);
        break;
      }
    }
  }

  if (!guardAddress) {
    throw new Error("CanonGuardCreated event not found in transaction logs");
  }

  // Step 5: Verify deployment by calling isChild() on the factory
  const isChild = await publicClient.readContract({
    address: factoryAddress,
    abi: canonGuardFactoryAbi,
    functionName: "isChild",
    args: [guardAddress],
  });

  if (!isChild) {
    throw new Error(`Guard verification failed: factory.isChild(${guardAddress}) returned false`);
  }

  return {
    guardAddress,
    transactionHash: hash,
    safeAddress,
    factoryAddress,
  };
}
