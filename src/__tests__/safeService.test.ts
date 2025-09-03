import { Address, PublicClient, MulticallReturnType } from "viem";
import { optimism } from "viem/chains";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { DEMO_GUARD_ADDRESS, DEMO_SAFE_WITH_GUARD } from "~/constants";
import { ClientService } from "~/services/clientService";
import { SafeService } from "~/services/safeService";
import { ZERO_STORAGE_SLOT } from "~/utils/hex";

// Test data - inline for clarity
const MOCK_SAFE_ADDRESS: Address = DEMO_SAFE_WITH_GUARD;
const MOCK_GUARD_ADDRESS: Address = DEMO_GUARD_ADDRESS;
const MOCK_OWNERS: Address[] = ["0xowner1", "0xowner2"];

const SUCCESSFUL_MULTICALL: MulticallReturnType = [
  { status: "success" as const, result: MOCK_OWNERS },
  { status: "success" as const, result: BigInt(2) }, // threshold
  { status: "success" as const, result: BigInt(5) }, // nonce
];

const FAILED_MULTICALL: MulticallReturnType = [
  { status: "failure" as const, error: new Error("Contract not found") },
  { status: "success" as const, result: 2n },
  { status: "success" as const, result: 5n },
];

// Generate guard storage slot dynamically to avoid false positive private key detection
const GUARD_STORAGE_WITH_GUARD = `0x${"0".repeat(24)}${MOCK_GUARD_ADDRESS.slice(2)}`;
const GUARD_STORAGE_NO_GUARD = ZERO_STORAGE_SLOT;

describe("SafeService Unit Tests", () => {
  let safeService: SafeService;
  const multicallMock = vi.fn();
  const getStorageAtMock = vi.fn();

  beforeAll(() => {
    const mockClient = {
      multicall: multicallMock,
      getStorageAt: getStorageAtMock,
    } as unknown as PublicClient;

    const mockClientService = {
      getClient: () => mockClient,
      getChain: () => optimism,
    } as unknown as ClientService;

    safeService = new SafeService(mockClientService);
  });

  it("should combine multicall results with guard detection to build complete vault info", async () => {
    // Setup: Mock successful multicall (owners, threshold, nonce) + guard storage
    multicallMock.mockResolvedValue(SUCCESSFUL_MULTICALL);
    getStorageAtMock.mockResolvedValue(GUARD_STORAGE_WITH_GUARD);

    const result = await safeService.getVaultInfo(MOCK_SAFE_ADDRESS);

    expect(result).toEqual({
      address: MOCK_SAFE_ADDRESS,
      chainId: optimism.id,
      network: optimism.name,
      threshold: 2,
      owners: MOCK_OWNERS,
      totalOwners: 2,
      hasCanonGuard: true,
      guardAddress: MOCK_GUARD_ADDRESS,
      nonce: 5,
    });
  });

  it("should throw error when multicall fails to get owners", async () => {
    // Setup: First multicall result (owners) fails, others succeed
    multicallMock.mockResolvedValue(FAILED_MULTICALL);

    await expect(safeService.getVaultInfo(MOCK_SAFE_ADDRESS)).rejects.toThrow("Failed to get owners");
  });

  it("should extract guard address from storage slot when guard exists", async () => {
    // Setup: Storage contains guard address in last 20 bytes (40 hex chars)
    getStorageAtMock.mockResolvedValue(GUARD_STORAGE_WITH_GUARD);

    const guardAddress = await safeService.getGuardAddress(MOCK_SAFE_ADDRESS);

    expect(guardAddress).toBe(MOCK_GUARD_ADDRESS);
  });

  it("should return null when guard storage slot is empty", async () => {
    // Setup: Storage slot contains all zeros (no guard configured)
    getStorageAtMock.mockResolvedValue(GUARD_STORAGE_NO_GUARD);

    const guardAddress = await safeService.getGuardAddress(MOCK_SAFE_ADDRESS);

    expect(guardAddress).toBeNull();
  });
});
