import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
  getAddress,
  zeroAddress,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import { CANON_GUARD_FACTORY, MULTI_SEND_CALL_ONLY } from "~/constants/addresses";

/**
 * Anvil's well-known private key for account 0
 * Public address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 */
const ANVIL_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

/**
 * Anvil account 0 address (derived from ANVIL_PRIVATE_KEY)
 */
const ANVIL_ACCOUNT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address;

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
 * Safe ABI for transaction execution
 */
const safeExecAbi = [
  {
    type: "function",
    name: "nonce",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTransactionHash",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "_nonce", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "execTransaction",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "signatures", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "payable",
  },
] as const;

/**
 * Safe ABI for reading owners (to verify signer is an owner)
 */
const safeOwnersAbi = [
  {
    type: "function",
    name: "getOwners",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
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
  /** Emergency trigger address (default: zero address) */
  emergencyTrigger?: Address;
  /** Emergency caller address (default: zero address) */
  emergencyCaller?: Address;
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
 * This function deploys a Canon Guard by executing the factory call through the Safe.
 * The factory requires msg.sender to be the Safe, so we use Safe.execTransaction.
 *
 * Uses direct ECDSA signature (same as Safe UI):
 * 1. Create clients and encode the createCanonGuard call data
 * 2. Verify signer is a Safe owner
 * 3. Get Safe's current nonce and transaction hash
 * 4. Sign the hash directly (raw ECDSA, v=27/28)
 * 5. Execute via Safe.execTransaction
 * 6. Parse CanonGuardCreated event from logs
 * 7. Verify deployment via factory.isChild()
 *
 * @param options - Deployment configuration
 * @returns Deployed Canon Guard information
 */
export async function deployCanonGuard(options: DeployCanonGuardOptions): Promise<DeployCanonGuardResult> {
  const {
    rpcUrl = "http://127.0.0.1:8545",
    safeAddress,
    shortTxExecutionDelay = 3600n, // 1 hour
    longTxExecutionDelay = 604800n, // 7 days
    txExpiryDelay = 604800n, // 7 days
    maxApprovalDuration = 10368000n, // ~4 months
    emergencyTrigger = ANVIL_ACCOUNT_ADDRESS, // Must be non-zero
    emergencyCaller = ANVIL_ACCOUNT_ADDRESS, // Must be non-zero
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

  // Step 2: Encode the createCanonGuard call
  const factoryCallData = encodeFunctionData({
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
  });

  // Step 3: Verify signer is an owner of the Safe
  const owners = await publicClient.readContract({
    address: safeAddress,
    abi: safeOwnersAbi,
    functionName: "getOwners",
  });

  const signerAddress = account.address.toLowerCase();
  const isOwner = owners.some((owner) => owner.toLowerCase() === signerAddress);
  if (!isOwner) {
    throw new Error(`Signer ${account.address} is not an owner of Safe ${safeAddress}. Owners: ${owners.join(", ")}`);
  }

  // Step 4: Get Safe's current nonce
  const nonce = await publicClient.readContract({
    address: safeAddress,
    abi: safeExecAbi,
    functionName: "nonce",
  });

  // Step 5: Get the transaction hash
  const safeTxHash = await publicClient.readContract({
    address: safeAddress,
    abi: safeExecAbi,
    functionName: "getTransactionHash",
    args: [
      CANON_GUARD_FACTORY, // to
      0n, // value
      factoryCallData, // data
      0, // operation (Call)
      0n, // safeTxGas
      0n, // baseGas
      0n, // gasPrice
      zeroAddress, // gasToken
      zeroAddress, // refundReceiver
      nonce, // _nonce
    ],
  });

  // Step 6: Sign the hash directly (raw ECDSA, no prefix)
  // The account.sign() method signs raw bytes without any prefix
  // This produces a standard ECDSA signature with v=27/28
  const signature = await account.sign({
    hash: safeTxHash,
  });

  // Step 7: Execute the transaction through Safe
  const { request } = await publicClient.simulateContract({
    address: safeAddress,
    abi: safeExecAbi,
    functionName: "execTransaction",
    args: [
      CANON_GUARD_FACTORY, // to
      0n, // value
      factoryCallData, // data
      0, // operation (Call)
      0n, // safeTxGas
      0n, // baseGas
      0n, // gasPrice
      zeroAddress, // gasToken
      zeroAddress, // refundReceiver
      signature, // ECDSA signature
    ],
    account,
  });

  const hash = await walletClient.writeContract(request);

  // Step 8: Wait for transaction confirmation and get receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Step 9: Parse the CanonGuardCreated event from logs
  // The factory emits an event with the guard address in topic[1]
  // The event signature varies by factory version, so we match by factory address
  let guardAddress: Address | undefined;

  for (const log of receipt.logs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logData = log as any;

    // Check if this log is from the Canon Guard Factory
    if (logData.address?.toLowerCase() === CANON_GUARD_FACTORY.toLowerCase()) {
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

  // Step 10: Verify deployment by calling isChild() on the factory
  const isChild = await publicClient.readContract({
    address: CANON_GUARD_FACTORY,
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
    factoryAddress: CANON_GUARD_FACTORY,
  };
}
