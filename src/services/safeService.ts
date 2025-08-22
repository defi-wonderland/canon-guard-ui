import { Address } from "viem";
import { SafeInfo } from "../types/safe";

class SafeService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifySafeAsCanonVault(_safe: Address): Promise<boolean> {
    return true;
  }

  async getSafeInfo(safe: Address): Promise<SafeInfo> {
    // Check if safe has guard and valid entrypoint

    return {
      address: safe,
      network: "ethereum",
      approvalThreshold: 2,
      totalOwners: 3,
      isValidCanonVault: await this.verifySafeAsCanonVault(safe),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getGuardAddress(_safe: Address): Promise<Address | null> {
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
