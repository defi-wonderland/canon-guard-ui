import { useState, useCallback } from "react";
import { Address, Hash, Hex, parseUnits, parseEther, decodeEventLog, erc20Abi } from "viem";
import { useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt, readContract } from "wagmi/actions";
import {
  simpleTransfersFactoryAbi,
  arbitraryActionsFactoryAbi,
  allowanceClaimorFactoryAbi,
  cappedTokenTransfersHubFactoryAbi,
  canonGuardRegistryAbi,
  canonGuardAbi,
  preApproveActionFactoryAbi,
  safeAbi,
  changeSafeGuardActionFactoryAbi,
} from "~/abis/canonGuard";
import { cappedTokenTransfersHubAbi } from "~/abis/canonGuard";
import type {
  TransferFormData,
  ArbitraryActionFormData,
  ClaimAllowanceFormData,
  CappedTransferHubFormData,
  HubChildFormData,
} from "~/components/NewAction/steps";
import {
  SIMPLE_TRANSFERS_FACTORY,
  ARBITRARY_ACTIONS_FACTORY,
  ALLOWANCE_CLAIMOR_FACTORY,
  CAPPED_TOKEN_TRANSFERS_HUB_FACTORY,
  CANON_GUARD_REGISTRY,
  PRE_APPROVE_ACTION_FACTORY,
  CHANGE_SAFE_GUARD_ACTION_FACTORY,
} from "~/constants/canonGuard";
import { EPOCH_TIME_MULTIPLIERS } from "~/utils/timeUnits";

/**
 * Transaction execution states
 */
export type ExecutionStatus = "idle" | "pending" | "confirming" | "success" | "error";

/**
 * Result of a deploy transaction
 */
export interface DeployResult {
  txHash: Hash;
  deployedAddress: Address;
}

/**
 * Result of a registry record transaction
 */
export interface RecordResult {
  txHash: Hash;
}

/**
 * Result of a queue transaction
 */
export interface QueueResult {
  txHash: Hash;
}

/**
 * Result of a sign transaction (Safe approveHash)
 */
export interface SignResult {
  txHash: Hash;
  safeTxHash: Hash;
}

/**
 * Result of deploying a pre-approval action
 */
export interface DeployPreApprovalResult {
  txHash: Hash;
  preApprovalAddress: Address;
}

/**
 * Hook for executing Canon Guard transaction steps
 * Supports: Deploy Contract, Save to Registry, Queue, Sign, Pre-Approval
 */
export function useTransactionExecutor() {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);

  /**
   * Fetch token decimals from the ERC20 contract
   */
  const getTokenDecimals = useCallback(
    async (tokenAddress: Address): Promise<number> => {
      try {
        const decimals = await readContract(config, {
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        });
        return decimals;
      } catch (err) {
        console.warn(`Failed to fetch decimals for ${tokenAddress}, defaulting to 18:`, err);
        return 18; // Default to 18 if call fails (some tokens don't implement decimals)
      }
    },
    [config],
  );

  /**
   * Execute the Deploy Contract step for SimpleTransfers
   * Calls SimpleTransfersFactory.createSimpleTransfers() and returns the deployed address
   */
  const executeDeployTransfer = useCallback(
    async (formData: TransferFormData): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        // Build the transfer action array from form data
        const transferActions = await Promise.all(
          formData.transfers.map(async (transfer) => {
            const tokenAddress = transfer.tokenAddress as Address;
            // Fetch the token's decimals from the ERC20 contract
            const decimals = await getTokenDecimals(tokenAddress);
            console.log(`Token ${tokenAddress} has ${decimals} decimals`);

            return {
              token: tokenAddress,
              to: transfer.recipientAddress as Address,
              amount: parseUnits(transfer.amount || "0", decimals),
            };
          }),
        );

        console.log("[useTransactionExecutor] Deploying transfers:", transferActions);

        // Execute the contract write
        const hash = await writeContractAsync({
          address: SIMPLE_TRANSFERS_FACTORY,
          abi: simpleTransfersFactoryAbi,
          functionName: "createSimpleTransfers",
          args: [transferActions],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the SimpleTransfersCreated event to get the deployed address
        // The event is: SimpleTransfersCreated(address indexed _simpleTransfers)
        console.log("[useTransactionExecutor] Parsing logs:", receipt.logs);
        const deployedAddress = parseDeployedAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy successful:", { txHash: hash, deployedAddress });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync, getTokenDecimals],
  );

  /**
   * Execute the Deploy Contract step for ArbitraryActions
   * Calls ArbitraryActionsFactory.createArbitraryActions() and returns the deployed address
   */
  const executeDeployArbitraryAction = useCallback(
    async (formData: ArbitraryActionFormData): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        // Build array of ArbitraryAction structs from form data
        // Signature is now optional - pass empty string if not provided
        const arbitraryActions = formData.actions.map((action) => {
          // Parse value - handle empty/undefined as 0
          let valueWei: bigint;
          if (!action.value || action.value.trim() === "") {
            valueWei = 0n;
          } else {
            // If user entered a decimal value, parse as ether; if whole number in wei, use directly
            const valueStr = action.value.trim();
            if (valueStr.includes(".")) {
              valueWei = parseEther(valueStr);
            } else {
              valueWei = BigInt(valueStr);
            }
          }

          return {
            target: action.target as Address,
            signature: action.signature || "", // Optional signature
            data: (action.data || "0x") as Hex, // Full calldata including selector
            value: valueWei,
          };
        });

        console.log("[useTransactionExecutor] Deploying ArbitraryActions:", arbitraryActions);

        // Execute the contract write
        const hash = await writeContractAsync({
          address: ARBITRARY_ACTIONS_FACTORY,
          abi: arbitraryActionsFactoryAbi,
          functionName: "createArbitraryActions",
          args: [arbitraryActions],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the ArbitraryActionsCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing ArbitraryActions logs:", receipt.logs);
        const deployedAddress = parseArbitraryActionsAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy ArbitraryAction successful:", { txHash: hash, deployedAddress });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy ArbitraryAction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Deploy Contract step for AllowanceClaimor
   * Calls AllowanceClaimorFactory.createAllowanceClaimor() and returns the deployed address
   */
  const executeDeployClaimAllowance = useCallback(
    async (formData: ClaimAllowanceFormData): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Deploying AllowanceClaimor:", {
          token: formData.token,
          tokenOwner: formData.tokenOwner,
          tokenRecipient: formData.tokenRecipient,
        });

        // Execute the contract write
        const hash = await writeContractAsync({
          address: ALLOWANCE_CLAIMOR_FACTORY,
          abi: allowanceClaimorFactoryAbi,
          functionName: "createAllowanceClaimor",
          args: [formData.token as Address, formData.tokenOwner as Address, formData.tokenRecipient as Address],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the AllowanceClaimorCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing AllowanceClaimor logs:", receipt.logs);
        const deployedAddress = parseAllowanceClaimorAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy AllowanceClaimor successful:", { txHash: hash, deployedAddress });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy AllowanceClaimor failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Deploy Hub Child step
   * Calls CappedTokenTransfersHub.createNewActionsBuilder(token, amount) and returns the deployed address
   */
  const executeDeployHubChild = useCallback(
    async (hubAddress: Address, formData: HubChildFormData): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        const tokenAddress = formData.token as Address;

        // Fetch the token's decimals from the ERC20 contract
        const decimals = await getTokenDecimals(tokenAddress);
        console.log(`Token ${tokenAddress} has ${decimals} decimals`);

        // Parse amount with correct decimals
        const amount = parseUnits(formData.amount || "0", decimals);

        console.log("[useTransactionExecutor] Deploying Hub Child:", {
          hubAddress,
          token: tokenAddress,
          amount: amount.toString(),
        });

        // Execute the contract write - call createNewActionsBuilder on the hub
        const hash = await writeContractAsync({
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "createNewActionsBuilder",
          args: [tokenAddress, amount],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the CappedTokenTransfersCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing Hub Child logs:", receipt.logs);
        const deployedAddress = parseHubChildAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy Hub Child successful:", { txHash: hash, deployedAddress });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy Hub Child failed:", error);
        return null;
      }
    },
    [config, writeContractAsync, getTokenDecimals],
  );

  /**
   * Execute the Deploy Contract step for CappedTokenTransfersHub
   * Calls CappedTokenTransfersHubFactory.createCappedTokenTransfersHub() and returns the deployed address
   */
  const executeDeployCappedTransferHub = useCallback(
    async (formData: CappedTransferHubFormData, safeAddress: Address): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        // Calculate epoch length in seconds
        const epochLengthValue = parseFloat(formData.epochLength) || 0;
        const epochLengthSeconds = BigInt(Math.floor(epochLengthValue * EPOCH_TIME_MULTIPLIERS[formData.epochUnit]));

        // Prepare tokens and caps arrays
        // For each token, fetch its decimals and parse the cap amount correctly
        const tokens: Address[] = [];
        const caps: bigint[] = [];

        for (const token of formData.tokens) {
          const tokenAddress = token.address as Address;
          tokens.push(tokenAddress);

          // Fetch token decimals
          const decimals = await getTokenDecimals(tokenAddress);
          console.log(`Token ${tokenAddress} has ${decimals} decimals`);

          // Parse cap with correct decimals
          const cap = parseUnits(token.amount || "0", decimals);
          caps.push(cap);
        }

        console.log("[useTransactionExecutor] Deploying CappedTokenTransfersHub:", {
          safe: safeAddress,
          recipient: formData.recipientAddress,
          tokens,
          caps: caps.map((c) => c.toString()),
          epochLength: epochLengthSeconds.toString(),
        });

        // Execute the contract write
        const hash = await writeContractAsync({
          address: CAPPED_TOKEN_TRANSFERS_HUB_FACTORY,
          abi: cappedTokenTransfersHubFactoryAbi,
          functionName: "createCappedTokenTransfersHub",
          args: [safeAddress, formData.recipientAddress as Address, tokens, caps, epochLengthSeconds],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the CappedTokenTransfersHubCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing CappedTokenTransfersHub logs:", receipt.logs);
        const deployedAddress = parseCappedTokenTransfersHubAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy CappedTokenTransfersHub successful:", {
          txHash: hash,
          deployedAddress,
        });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy CappedTokenTransfersHub failed:", error);
        return null;
      }
    },
    [config, writeContractAsync, getTokenDecimals],
  );

  /**
   * Execute the Deploy Contract step for ChangeSafeGuardAction
   * Calls ChangeSafeGuardActionFactory.createChangeSafeGuardAction(newGuardAddress) and returns the deployed address
   * Used to attach or detach Canon Guard from a Safe
   * @param newGuardAddress - The guard address to set. Use address(0) to detach, or a valid Canon Guard address to attach.
   */
  const executeDeployChangeSafeGuardAction = useCallback(
    async (newGuardAddress?: Address): Promise<DeployResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      const targetAddress = newGuardAddress ?? ("0x0000000000000000000000000000000000000000" as Address);
      const action = newGuardAddress ? "attach" : "detach";

      try {
        console.log(`[useTransactionExecutor] Deploying ChangeSafeGuardAction to ${action} guard:`, targetAddress);

        // Execute the contract write
        const hash = await writeContractAsync({
          address: CHANGE_SAFE_GUARD_ACTION_FACTORY,
          abi: changeSafeGuardActionFactoryAbi,
          functionName: "createChangeSafeGuardAction",
          args: [targetAddress],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        // Parse the ChangeSafeGuardActionCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing ChangeSafeGuardAction logs:", receipt.logs);
        const deployedAddress = parseChangeSafeGuardActionAddress(receipt.logs);

        if (!deployedAddress) {
          console.error("[useTransactionExecutor] Failed to parse deployed address from logs");
          throw new Error("Could not find deployed address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy ChangeSafeGuardAction successful:", {
          txHash: hash,
          deployedAddress,
        });
        setStatus("success");
        return { txHash: hash, deployedAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        setStatus("error");
        console.error("Deploy ChangeSafeGuardAction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Save to Registry step
   * Calls CanonGuardRegistry.record() to save the deployed action with its label
   */
  const executeRecordToRegistry = useCallback(
    async (guardAddress: Address, deployedActionAddress: Address, label: string): Promise<RecordResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Recording to registry:", {
          guardAddress,
          deployedActionAddress,
          label,
        });

        // Execute the contract write
        // record(address _canonGuard, address[] _entities, string[] _labels)
        const hash = await writeContractAsync({
          address: CANON_GUARD_REGISTRY,
          abi: canonGuardRegistryAbi,
          functionName: "record",
          args: [
            guardAddress,
            [deployedActionAddress], // entities array with single item
            [label], // labels array with single item
          ],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        console.log("[useTransactionExecutor] Registry record successful:", { txHash: hash });
        setStatus("success");
        return { txHash: hash };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Registry record failed");
        setError(error);
        setStatus("error");
        console.error("Registry record transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Queue Transaction step
   * Calls canonGuard.queueTransaction(actionBuilderAddress)
   */
  const executeQueueTransaction = useCallback(
    async (guardAddress: Address, actionBuilderAddress: Address): Promise<QueueResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Queueing transaction:", {
          guardAddress,
          actionBuilderAddress,
        });

        const hash = await writeContractAsync({
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "queueTransaction",
          args: [actionBuilderAddress],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Queue transaction reverted");
        }

        console.log("[useTransactionExecutor] Queue successful:", { txHash: hash });
        setStatus("success");
        return { txHash: hash };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Queue transaction failed");
        setError(error);
        setStatus("error");
        console.error("Queue transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Sign Transaction step
   * 1. Get the safeTxHash from canonGuard.getSafeTransactionHash(actionBuilderAddress, nonce?)
   * 2. Call safe.approveHash(safeTxHash)
   *
   * @param nonce - Optional nonce to sign at. If provided, uses getSafeTransactionHash(actionBuilder, nonce).
   *                If not provided, uses getSafeTransactionHash(actionBuilder) which auto-detects current nonce.
   */
  const executeSignTransaction = useCallback(
    async (
      safeAddress: Address,
      guardAddress: Address,
      actionBuilderAddress: Address,
      nonce?: number,
    ): Promise<SignResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Signing transaction:", {
          safeAddress,
          guardAddress,
          actionBuilderAddress,
          nonce,
        });

        // Step 1: Get the Safe transaction hash from the Canon Guard
        // Use nonce-specific method if provided, otherwise auto-detect
        const safeTxHash =
          nonce !== undefined
            ? ((await readContract(config, {
                address: guardAddress,
                abi: canonGuardAbi,
                functionName: "getSafeTransactionHash",
                args: [actionBuilderAddress, BigInt(nonce)],
              })) as Hash)
            : ((await readContract(config, {
                address: guardAddress,
                abi: canonGuardAbi,
                functionName: "getSafeTransactionHash",
                args: [actionBuilderAddress],
              })) as Hash);

        console.log("[useTransactionExecutor] Got safeTxHash:", safeTxHash, "for nonce:", nonce);

        // Step 2: Approve the hash in the Safe
        const hash = await writeContractAsync({
          address: safeAddress,
          abi: safeAbi,
          functionName: "approveHash",
          args: [safeTxHash],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Sign transaction reverted");
        }

        console.log("[useTransactionExecutor] Sign successful:", { txHash: hash, safeTxHash, nonce });
        setStatus("success");
        return { txHash: hash, safeTxHash };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Sign transaction failed");
        setError(error);
        setStatus("error");
        console.error("Sign transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Deploy Pre-Approval step
   * Calls PreApproveActionFactory.createPreApproveAction(actionBuilderAddress, approvalDuration)
   */
  const executeDeployPreApproval = useCallback(
    async (actionBuilderAddress: Address, approvalDuration: bigint): Promise<DeployPreApprovalResult | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Deploying pre-approval:", {
          actionBuilderAddress,
          approvalDuration: approvalDuration.toString(),
        });

        const hash = await writeContractAsync({
          address: PRE_APPROVE_ACTION_FACTORY,
          abi: preApproveActionFactoryAbi,
          functionName: "createPreApproveAction",
          args: [actionBuilderAddress, approvalDuration],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Deploy pre-approval reverted");
        }

        // Parse the PreApproveActionCreated event to get the deployed address
        console.log("[useTransactionExecutor] Parsing pre-approval logs:", receipt.logs);
        const preApprovalAddress = parsePreApprovalAddress(receipt.logs);

        if (!preApprovalAddress) {
          console.error("[useTransactionExecutor] Failed to parse pre-approval address from logs");
          throw new Error("Could not find pre-approval address in transaction logs");
        }

        console.log("[useTransactionExecutor] Deploy pre-approval successful:", { txHash: hash, preApprovalAddress });
        setStatus("success");
        return { txHash: hash, preApprovalAddress };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Deploy pre-approval failed");
        setError(error);
        setStatus("error");
        console.error("Deploy pre-approval failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute a queued Canon Guard transaction
   * Calls canonGuard.executeTransaction(actionBuilder)
   */
  const executeCanonTransaction = useCallback(
    async (guardAddress: Address, actionBuilderAddress: Address): Promise<Hash | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log(`Executing Canon Guard transaction for action builder: ${actionBuilderAddress}`);
        console.log(`Canon Guard address: ${guardAddress}`);

        // Call executeTransaction on Canon Guard
        const hash = await writeContractAsync({
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "executeTransaction",
          args: [actionBuilderAddress],
        });

        console.log(`Execute transaction submitted: ${hash}`);
        setTxHash(hash);
        setStatus("confirming");

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, {
          hash,
          confirmations: 1,
        });

        if (receipt.status === "reverted") {
          throw new Error("Execute transaction reverted");
        }

        console.log(`Execute transaction confirmed: ${hash}`);
        setStatus("success");
        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        console.error("Execute Canon Guard transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Remove from Registry step
   * Calls CanonGuardRegistry.remove(guardAddress, entityAddresses)
   */
  const executeRemoveFromRegistry = useCallback(
    async (guardAddress: Address, entityAddresses: Address[]): Promise<Hash | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Removing from registry:", {
          guardAddress,
          entityAddresses,
        });

        const hash = await writeContractAsync({
          address: CANON_GUARD_REGISTRY,
          abi: canonGuardRegistryAbi,
          functionName: "remove",
          args: [guardAddress, entityAddresses],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Remove from registry transaction reverted");
        }

        console.log("[useTransactionExecutor] Remove from registry successful:", { txHash: hash });
        setStatus("success");
        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Remove from registry failed");
        setError(error);
        setStatus("error");
        console.error("Remove from registry failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Execute the Cancel Enqueued Transaction step
   * Calls CanonGuard.cancelEnqueuedTransaction(actionBuilderAddress)
   * Only the proposer can cancel a non-expired transaction
   */
  const executeCancelTransaction = useCallback(
    async (guardAddress: Address, actionBuilderAddress: Address): Promise<Hash | null> => {
      setStatus("pending");
      setError(null);
      setTxHash(null);

      try {
        console.log("[useTransactionExecutor] Cancelling enqueued transaction:", {
          guardAddress,
          actionBuilderAddress,
        });

        const hash = await writeContractAsync({
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "cancelEnqueuedTransaction",
          args: [actionBuilderAddress],
        });

        setTxHash(hash);
        setStatus("confirming");

        const receipt = await waitForTransactionReceipt(config, { hash });

        if (receipt.status === "reverted") {
          throw new Error("Cancel enqueued transaction reverted");
        }

        console.log("[useTransactionExecutor] Cancel enqueued transaction successful:", { txHash: hash });
        setStatus("success");
        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Cancel enqueued transaction failed");
        setError(error);
        setStatus("error");
        console.error("Cancel enqueued transaction failed:", error);
        return null;
      }
    },
    [config, writeContractAsync],
  );

  /**
   * Reset the executor state
   */
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return {
    // State
    status,
    error,
    txHash,
    isExecuting: status === "pending" || status === "confirming",

    // Actions
    executeDeployTransfer,
    executeDeployArbitraryAction,
    executeDeployClaimAllowance,
    executeDeployHubChild,
    executeDeployCappedTransferHub,
    executeDeployChangeSafeGuardAction,
    executeRecordToRegistry,
    executeQueueTransaction,
    executeSignTransaction,
    executeDeployPreApproval,
    executeCanonTransaction,
    executeRemoveFromRegistry,
    executeCancelTransaction,
    reset,
  };
}

/**
 * Parse the deployed address from transaction logs
 * Looks for the SimpleTransfersCreated event
 */
function parseDeployedAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: simpleTransfersFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "SimpleTransfersCreated") {
        // The event has: SimpleTransfersCreated(address indexed _simpleTransfers)
        return (decoded.args as { _simpleTransfers: Address })._simpleTransfers;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the pre-approval address from transaction logs
 * Looks for the PreApproveActionCreated event
 */
function parsePreApprovalAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: preApproveActionFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "PreApproveActionCreated") {
        // The event has: PreApproveActionCreated(address indexed _preApproveAction, address indexed _actionsBuilder, uint256 _approvalDuration)
        return (decoded.args as { _preApproveAction: Address })._preApproveAction;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the deployed ArbitraryActions address from transaction logs
 * Looks for the ArbitraryActionsCreated event
 */
function parseArbitraryActionsAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: arbitraryActionsFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "ArbitraryActionsCreated") {
        // The event has: ArbitraryActionsCreated(address indexed _arbitraryActions)
        return (decoded.args as { _arbitraryActions: Address })._arbitraryActions;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the deployed AllowanceClaimor address from transaction logs
 * Looks for the AllowanceClaimorCreated event
 */
function parseAllowanceClaimorAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: allowanceClaimorFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "AllowanceClaimorCreated") {
        // The event has: AllowanceClaimorCreated(address indexed _allowanceClaimor, address indexed _token, address indexed _tokenOwner, address _tokenRecipient)
        return (decoded.args as { _allowanceClaimor: Address })._allowanceClaimor;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the deployed CappedTokenTransfersHub address from transaction logs
 * Looks for the CappedTokenTransfersHubCreated event
 */
function parseCappedTokenTransfersHubAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: cappedTokenTransfersHubFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "CappedTokenTransfersHubCreated") {
        // The event has: CappedTokenTransfersHubCreated(address indexed _cappedTokenTransfersHub, address indexed _safe, address indexed _recipient)
        return (decoded.args as { _cappedTokenTransfersHub: Address })._cappedTokenTransfersHub;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the deployed Hub Child (CappedTokenTransfers) address from transaction logs
 * Looks for the CappedTokenTransfersCreated event emitted by the hub
 */
function parseHubChildAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: cappedTokenTransfersHubAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "CappedTokenTransfersCreated") {
        // The event has: CappedTokenTransfersCreated(address indexed _actionsBuilder, address _token, uint256 _amount)
        return (decoded.args as { _actionsBuilder: Address })._actionsBuilder;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

/**
 * Parse the deployed ChangeSafeGuardAction address from transaction logs
 * Looks for the ChangeSafeGuardActionCreated event
 */
function parseChangeSafeGuardActionAddress(
  logs: readonly { data: `0x${string}`; topics: readonly `0x${string}`[] }[],
): Address | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: changeSafeGuardActionFactoryAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "ChangeSafeGuardActionCreated") {
        // The event has: ChangeSafeGuardActionCreated(address indexed _changeSafeGuardAction, address indexed _safeGuard)
        return (decoded.args as { _changeSafeGuardAction: Address })._changeSafeGuardAction;
      }
    } catch {
      // Not the event we're looking for, continue
      continue;
    }
  }
  return null;
}

export type UseTransactionExecutorReturn = ReturnType<typeof useTransactionExecutor>;
