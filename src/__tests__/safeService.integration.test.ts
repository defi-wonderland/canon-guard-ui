import { optimism } from "viem/chains";
import { describe, it, expect, beforeAll } from "vitest";
import {
  DEMO_SAFE_WITH_GUARD,
  DEMO_GUARD_ADDRESS,
  DEMO_SAFE_NO_GUARD,
  DEMO_SAFE_OWNER,
  USDC_OPTIMISM,
  OPTIMISM_MAINNET_RPC,
} from "~/constants/addresses";
import { ClientService } from "~/services/clientService";
import { SafeService } from "~/services/safeService";

describe("SafeService Integration Tests", () => {
  let safeService: SafeService;

  beforeAll(() => {
    const clientService = new ClientService(OPTIMISM_MAINNET_RPC, optimism);
    safeService = new SafeService(clientService);
  });

  it("should detect Safe with guard correctly", async () => {
    const vaultInfo = await safeService.getVaultInfo(DEMO_SAFE_WITH_GUARD);
    const guardAddress = await safeService.getGuardAddress(DEMO_SAFE_WITH_GUARD);

    expect(vaultInfo.hasCanonGuard).toBe(true);
    expect(vaultInfo.guardAddress).toBe(DEMO_GUARD_ADDRESS);
    expect(guardAddress).toBe(DEMO_GUARD_ADDRESS);
    expect(vaultInfo.owners).toContain(DEMO_SAFE_OWNER);
  });

  it("should detect Safe without guard correctly", async () => {
    const vaultInfo = await safeService.getVaultInfo(DEMO_SAFE_NO_GUARD);
    const guardAddress = await safeService.getGuardAddress(DEMO_SAFE_NO_GUARD);

    expect(vaultInfo.hasCanonGuard).toBe(false);
    expect(vaultInfo.guardAddress).toBeUndefined();
    expect(guardAddress).toBeNull();
  });

  it("should reject non-Safe contracts", async () => {
    await expect(safeService.getVaultInfo(USDC_OPTIMISM)).rejects.toThrow();

    const guardAddress = await safeService.getGuardAddress(USDC_OPTIMISM);
    expect(guardAddress).toBeNull();
  });
});
