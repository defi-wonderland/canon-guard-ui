import { Address } from "viem";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CanonGuardService } from "~/services/canonGuardService";
import { ClientService } from "~/services/clientService";

describe("CanonGuardService", () => {
  let service: CanonGuardService;
  let mockMulticall: ReturnType<typeof vi.fn>;
  let mockReadContract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMulticall = vi.fn();
    mockReadContract = vi.fn();

    const mockClient = { multicall: mockMulticall, readContract: mockReadContract };
    const mockClientService = { getClient: () => mockClient };

    service = new CanonGuardService(mockClientService as unknown as ClientService);
  });

  it("returns empty data when no actions exist", async () => {
    mockReadContract.mockResolvedValue([]);

    const result = await service.getCanonGuardData("0x123" as Address, 1);

    expect(result.queuedTransactions).toEqual([]);
    expect(result.preApprovedItems).toEqual([]);
    expect(result.executionHistory).toEqual([]);
  });

  it("processes queued transactions", async () => {
    const now = Math.floor(Date.now() / 1000);

    mockReadContract.mockResolvedValueOnce(["0xaction1"]);

    mockReadContract.mockResolvedValueOnce(BigInt(1));

    mockMulticall.mockResolvedValueOnce([
      { status: "success", result: ["0x1234", BigInt(now + 100), BigInt(now + 1000)] },
      { status: "success", result: "0xhash" },
      { status: "success", result: BigInt(now + 500) },
      { status: "success", result: [] },
    ]);

    mockReadContract.mockResolvedValueOnce([{ target: "0xtoken", data: "0xa9059cbb", value: 0n }]);

    const result = await service.getCanonGuardData("0x123" as Address, 1);

    expect(result.queuedTransactions).toHaveLength(1);
  });

  it("handles errors gracefully", async () => {
    mockReadContract.mockRejectedValue(new Error("Network error"));

    const result = await service.getCanonGuardData("0x123" as Address, 1);

    expect(result.queuedTransactions).toEqual([]);
    expect(result.preApprovedItems).toEqual([]);
    expect(result.executionHistory).toEqual([]);
  });
});
