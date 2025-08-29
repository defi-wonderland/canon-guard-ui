import { Address } from "viem";
import { VaultInfo } from "../types/canon-guard";

class SafeService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifySafeAsCanonVault(_safe: Address): Promise<boolean> {
    return true;
  }

  async getVaultInfo(safe: Address): Promise<VaultInfo> {
    // Check if safe has guard and valid entrypoint

    return {
      address: safe,
      chainId: 1,
      network: "ethereum",
      threshold: 2,
      owners: await this.getSafeOwners(safe),
      totalOwners: 3,
      hasCanonGuard: await this.verifySafeAsCanonVault(safe),
      guardAddress: await this.getGuardAddress(safe),
      nonce: 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getGuardAddress(_safe: Address): Promise<Address | string> {
    return "0x1234567890123456789012345678901234567890";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isValidEntrypoint(_guardAddress: Address): Promise<boolean> {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSafeOwners(_safe: Address): Promise<Address[]> {
    return [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSafeApprovalThreshold(_safe: Address): Promise<number> {
    return 2;
  }
}

export const safeService = new SafeService();
