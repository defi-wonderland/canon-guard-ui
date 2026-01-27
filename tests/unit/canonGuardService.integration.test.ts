import { Address } from "viem";
import { optimism } from "viem/chains";
import { describe, it, expect, beforeAll } from "vitest";
import { OPTIMISM_MAINNET_RPC } from "~/constants/addresses";
import { CanonGuardService } from "~/services/canonGuardService";
import { ClientService } from "~/services/clientService";

const NEW_GUARD_ADDRESS: Address = "0xe53d45e11897B1FB5aC94f675589072E838CFd1d";

const EXPECTED_QUEUED_TRANSACTIONS = [
  "0x00cE00912a2dEbE04E2dB6C713b846dE3ba44d68",
  "0xf64343c0d8c90BF10117285661D74FcB0f46C27d",
  "0xaEf36aE38FE2969B95aBB4432e879BA3255f1aFE",
  "0x1BaBb4e2136bF396a5335C333B25496211a75267",
] as const;

const EXPECTED_PRE_APPROVED_ITEMS = [
  "0xaEf36aE38FE2969B95aBB4432e879BA3255f1aFE",
  "0x1BaBb4e2136bF396a5335C333B25496211a75267",
] as const;

describe("CanonGuardService Integration", () => {
  let service: CanonGuardService;

  beforeAll(() => {
    const client = new ClientService(OPTIMISM_MAINNET_RPC, optimism);
    service = new CanonGuardService(client);
  });

  it("fetches real Canon Guard vault data", async () => {
    const data = await service.getCanonGuardData(NEW_GUARD_ADDRESS, 3);

    expect(data.queuedTransactions).toHaveLength(EXPECTED_QUEUED_TRANSACTIONS.length);
    expect(data.preApprovedItems).toHaveLength(EXPECTED_PRE_APPROVED_ITEMS.length);
    expect(data.executionHistory).toHaveLength(0);

    expect(data.queuedTransactions[0].actionBuilder.address).toBe(EXPECTED_QUEUED_TRANSACTIONS[0]);
    expect(data.queuedTransactions[0].state).toBe("executable");
    expect(data.queuedTransactions[0].actionBuilder.factoryType).toBe("simple_transfers");
    expect(data.queuedTransactions[0].actionBuilder.factoryLabel).toBe("Simple Transfers Factory");

    expect(data.preApprovedItems[0].address).toBe(EXPECTED_PRE_APPROVED_ITEMS[0]);
    expect(data.preApprovedItems[0].type).toBe("builder");
    expect(data.preApprovedItems[0].factoryType).toBe("simple_transfers");
  });
});
