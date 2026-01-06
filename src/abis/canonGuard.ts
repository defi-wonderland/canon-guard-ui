import IActionsBuilderABI from "@defi-wonderland/canon-guard-interfaces/abi/IActionsBuilder.json";
import IApproveActionFactoryABI from "@defi-wonderland/canon-guard-interfaces/abi/IApproveActionFactory.json";
import ISafeEntrypointABI from "@defi-wonderland/canon-guard-interfaces/abi/ISafeEntrypoint.json";
import ISimpleActionsFactoryABI from "@defi-wonderland/canon-guard-interfaces/abi/ISimpleActionsFactory.json";
import { Abi } from "viem";

export const canonGuardEntrypointAbi = ISafeEntrypointABI.abi as Abi;
export const actionBuilderAbi = IActionsBuilderABI.abi as Abi;
export const simpleActionsFactoryAbi = ISimpleActionsFactoryABI.abi as Abi;
export const approveActionFactoryAbi = IApproveActionFactoryABI.abi as Abi;

// Canon Guard ABI for transaction management functions
export const canonGuardAbi = [
  // MAX_APPROVAL_DURATION - immutable value for approval validation
  {
    type: "function",
    name: "MAX_APPROVAL_DURATION",
    inputs: [],
    outputs: [{ name: "_maxApprovalDuration", type: "uint256" }],
    stateMutability: "view",
  },
  // SHORT_TX_EXECUTION_DELAY - fast path delay
  {
    type: "function",
    name: "SHORT_TX_EXECUTION_DELAY",
    inputs: [],
    outputs: [{ name: "_shortTxExecutionDelay", type: "uint256" }],
    stateMutability: "view",
  },
  // LONG_TX_EXECUTION_DELAY - slow path delay
  {
    type: "function",
    name: "LONG_TX_EXECUTION_DELAY",
    inputs: [],
    outputs: [{ name: "_longTxExecutionDelay", type: "uint256" }],
    stateMutability: "view",
  },
  // TX_EXPIRY_DELAY - execution timeframe
  {
    type: "function",
    name: "TX_EXPIRY_DELAY",
    inputs: [],
    outputs: [{ name: "_txExpiryDelay", type: "uint256" }],
    stateMutability: "view",
  },
  // queueTransaction - add a transaction to the Canon Guard queue
  {
    type: "function",
    name: "queueTransaction",
    inputs: [{ name: "_actionsBuilder", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // executeTransaction - execute a queued transaction
  {
    type: "function",
    name: "executeTransaction",
    inputs: [{ name: "_actionsBuilder", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // getSafeTransactionHash - get the hash to sign for a queued transaction (current nonce)
  {
    type: "function",
    name: "getSafeTransactionHash",
    inputs: [{ name: "_actionsBuilder", type: "address" }],
    outputs: [{ name: "_safeTxHash", type: "bytes32" }],
    stateMutability: "view",
  },
  // getSafeTransactionHash - get the hash for a specific nonce (overloaded)
  {
    type: "function",
    name: "getSafeTransactionHash",
    inputs: [
      { name: "_actionsBuilder", type: "address" },
      { name: "_safeNonce", type: "uint256" },
    ],
    outputs: [{ name: "_safeTxHash", type: "bytes32" }],
    stateMutability: "view",
  },
  // transactionsInfo - get transaction details for an action builder
  {
    type: "function",
    name: "transactionsInfo",
    inputs: [{ name: "_actionsBuilder", type: "address" }],
    outputs: [
      { name: "_proposer", type: "address" },
      { name: "_actionsData", type: "bytes" },
      { name: "_executableAt", type: "uint256" },
      { name: "_expiresAt", type: "uint256" },
      { name: "_isPreApproved", type: "bool" },
    ],
    stateMutability: "view",
  },
  // getApprovedHashSigners - get signers who approved for a specific nonce
  {
    type: "function",
    name: "getApprovedHashSigners",
    inputs: [
      { name: "_actionsBuilder", type: "address" },
      { name: "_safeNonce", type: "uint256" },
    ],
    outputs: [{ name: "_approvedHashSigners", type: "address[]" }],
    stateMutability: "view",
  },
  // getSafeNonce - get current Safe nonce
  {
    type: "function",
    name: "getSafeNonce",
    inputs: [],
    outputs: [{ name: "_safeNonce", type: "uint256" }],
    stateMutability: "view",
  },
  // getQueuedActionBuilders - get all action builders in queue
  {
    type: "function",
    name: "getQueuedActionBuilders",
    inputs: [],
    outputs: [{ name: "_queuedActionBuilders", type: "address[]" }],
    stateMutability: "view",
  },
  // cancelEnqueuedTransaction - cancel a queued transaction (only proposer can cancel non-expired)
  {
    type: "function",
    name: "cancelEnqueuedTransaction",
    inputs: [{ name: "_actionsBuilder", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // emergencyMode - check if emergency mode is active
  {
    type: "function",
    name: "emergencyMode",
    inputs: [],
    outputs: [{ name: "_emergencyMode", type: "bool" }],
    stateMutability: "view",
  },
  // emergencyTrigger - address that can turn ON emergency mode
  {
    type: "function",
    name: "emergencyTrigger",
    inputs: [],
    outputs: [{ name: "_emergencyTrigger", type: "address" }],
    stateMutability: "view",
  },
  // emergencyCaller - address that can turn OFF emergency mode and execute/cancel during emergency
  {
    type: "function",
    name: "emergencyCaller",
    inputs: [],
    outputs: [{ name: "_emergencyCaller", type: "address" }],
    stateMutability: "view",
  },
  // setEmergencyMode - activate emergency mode (only callable by emergencyTrigger)
  {
    type: "function",
    name: "setEmergencyMode",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Pre-Approve Action Factory ABI for creating pre-approval actions
export const preApproveActionFactoryAbi = [
  // createPreApproveAction - deploy a new pre-approval action
  {
    type: "function",
    name: "createPreApproveAction",
    inputs: [
      { name: "_actionsBuilder", type: "address" },
      { name: "_approvalDuration", type: "uint256" },
    ],
    outputs: [{ name: "_preApproveAction", type: "address" }],
    stateMutability: "nonpayable",
  },
  // PreApproveActionCreated event - emitted when a pre-approval is deployed
  {
    type: "event",
    name: "PreApproveActionCreated",
    inputs: [
      { name: "_preApproveAction", type: "address", indexed: true },
      { name: "_actionsBuilder", type: "address", indexed: true },
      { name: "_approvalDuration", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

// TODO: Use package ABI when it includes the SimpleTransfersCreated event
// The package ABI is missing the event, so we define it manually here
export const simpleTransfersFactoryAbi = [
  // Function: createSimpleTransfers
  {
    type: "function",
    name: "createSimpleTransfers",
    inputs: [
      {
        name: "_transferActions",
        type: "tuple[]",
        internalType: "struct ISimpleTransfers.TransferAction[]",
        components: [
          { name: "token", type: "address", internalType: "address" },
          { name: "to", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "_simpleTransfers", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  // Event: SimpleTransfersCreated (missing from package ABI!)
  {
    type: "event",
    name: "SimpleTransfersCreated",
    inputs: [{ name: "_simpleTransfers", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },
] as const;

// Minimal ABI for CanonGuardFactory.isChild(address) check
export const canonGuardFactoryAbi = [
  {
    type: "function",
    name: "isChild",
    inputs: [{ name: "_contract", type: "address" }],
    outputs: [{ name: "_isChild", type: "bool" }],
    stateMutability: "view",
  },
] as const;

// Safe ABI for hash approval and threshold/owners
export const safeAbi = [
  {
    type: "function",
    name: "approveHash",
    inputs: [{ name: "hashToApprove", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getThreshold",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwners",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
] as const;

// TODO: Import from @defi-wonderland/canon-guard-interfaces when ICanonGuardRegistry is added to the package
// Full ABI from contracts/src/interfaces/periphery/ICanonGuardRegistry.sol
export const canonGuardRegistryAbi = [
  // Errors
  { inputs: [], name: "ArrayLengthMismatch", type: "error" },
  { inputs: [], name: "EmptyLabel", type: "error" },
  { inputs: [], name: "EntityNotFound", type: "error" },
  { inputs: [], name: "NotSafeSigner", type: "error" },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_canonGuard", type: "address" },
      { indexed: true, internalType: "address", name: "_entity", type: "address" },
      { indexed: false, internalType: "string", name: "_label", type: "string" },
      { indexed: false, internalType: "uint256", name: "_lastEditedAt", type: "uint256" },
    ],
    name: "EntityRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_canonGuard", type: "address" },
      { indexed: true, internalType: "address", name: "_entity", type: "address" },
    ],
    name: "EntityRemoved",
    type: "event",
  },
  // Functions
  {
    inputs: [
      { internalType: "address", name: "_canonGuard", type: "address" },
      { internalType: "address", name: "_entity", type: "address" },
    ],
    name: "entityLabel",
    outputs: [
      {
        components: [
          { internalType: "string", name: "label", type: "string" },
          { internalType: "uint256", name: "lastEditedAt", type: "uint256" },
        ],
        internalType: "struct ICanonGuardRegistry.Edition",
        name: "_edition",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_canonGuard", type: "address" },
      { internalType: "uint256", name: "_offset", type: "uint256" },
      { internalType: "uint256", name: "_limit", type: "uint256" },
    ],
    name: "read",
    outputs: [
      {
        components: [
          { internalType: "address", name: "entity", type: "address" },
          {
            components: [
              { internalType: "string", name: "label", type: "string" },
              { internalType: "uint256", name: "lastEditedAt", type: "uint256" },
            ],
            internalType: "struct ICanonGuardRegistry.Edition",
            name: "edition",
            type: "tuple",
          },
        ],
        internalType: "struct ICanonGuardRegistry.EntityWithEdition[]",
        name: "_entities",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_canonGuard", type: "address" },
      { internalType: "address[]", name: "_entities", type: "address[]" },
      { internalType: "string[]", name: "_labels", type: "string[]" },
    ],
    name: "record",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_canonGuard", type: "address" },
      { internalType: "address[]", name: "_entities", type: "address[]" },
    ],
    name: "remove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_canonGuard", type: "address" }],
    name: "totalEntities",
    outputs: [{ internalType: "uint256", name: "_total", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// PARENT() function ABI for action builders
// All action builders inherit from ActionsBuilder which has a PARENT() function that returns the factory address
export const actionBuilderParentAbi = [
  {
    type: "function",
    name: "PARENT",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

// Minimal ABI for approvalExpiries on Canon Guard entrypoint
// Returns uint256 timestamp of when the approval expires for a given action builder
export const approvalExpiriesAbi = [
  {
    type: "function",
    name: "approvalExpiries",
    inputs: [{ name: "_actionBuilder", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// PreApproveAction ABI for getting the underlying action builder
// PreApproveAction wraps another action builder and exposes it via ACTIONS_BUILDER()
export const preApproveActionAbi = [
  {
    type: "function",
    name: "ACTIONS_BUILDER",
    inputs: [],
    outputs: [{ name: "_actionsBuilder", type: "address" }],
    stateMutability: "view",
  },
] as const;

// Custom SimpleActionsFactory ABI with createSimpleAction (singular) and event
// The package ABI might only include createSimpleActions (plural) without the event
export const simpleActionFactoryAbi = [
  // Function: createSimpleAction - deploys a new SimpleActions contract with a single action
  {
    type: "function",
    name: "createSimpleAction",
    inputs: [
      {
        name: "_simpleAction",
        type: "tuple",
        internalType: "struct ISimpleActions.SimpleAction",
        components: [
          { name: "target", type: "address", internalType: "address" },
          { name: "signature", type: "string", internalType: "string" },
          { name: "data", type: "bytes", internalType: "bytes" },
          { name: "value", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "_simpleActions", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  // Event: SimpleActionsCreated - emitted when a SimpleActions contract is deployed
  {
    type: "event",
    name: "SimpleActionsCreated",
    inputs: [{ name: "_simpleActions", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },
] as const;

// AllowanceClaimorFactory ABI for creating allowance claimor action builders
// Allowance claimor allows claiming token allowances from a token owner to a recipient
export const allowanceClaimorFactoryAbi = [
  // Function: createAllowanceClaimor - deploys a new AllowanceClaimor contract
  {
    type: "function",
    name: "createAllowanceClaimor",
    inputs: [
      { name: "_token", type: "address", internalType: "address" },
      { name: "_tokenOwner", type: "address", internalType: "address" },
      { name: "_tokenRecipient", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "_allowanceClaimor", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  // Event: AllowanceClaimorCreated - emitted when an AllowanceClaimor contract is deployed
  {
    type: "event",
    name: "AllowanceClaimorCreated",
    inputs: [
      { name: "_allowanceClaimor", type: "address", indexed: true, internalType: "address" },
      { name: "_token", type: "address", indexed: true, internalType: "address" },
      { name: "_tokenOwner", type: "address", indexed: true, internalType: "address" },
      { name: "_tokenRecipient", type: "address", indexed: false, internalType: "address" },
    ],
    anonymous: false,
  },
] as const;
