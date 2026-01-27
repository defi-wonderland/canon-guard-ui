import { describe, it, expect, beforeEach } from "vitest";
import { ClientService } from "~/services/clientService";

describe("ClientService", () => {
  let clientService: ClientService;
  const TEST_RPC_URL = "https://mainnet.optimism.io";

  beforeEach(() => {
    clientService = new ClientService(TEST_RPC_URL);
  });

  describe("constructor", () => {
    it("should create a ClientService with valid RPC URL", () => {
      expect(clientService).toBeInstanceOf(ClientService);
    });

    it("should create a PublicClient instance", () => {
      const client = clientService.getClient();
      expect(client).toBeDefined();
      expect(typeof client.readContract).toBe("function");
      expect(typeof client.multicall).toBe("function");
    });
  });

  describe("getClient", () => {
    it("should return a PublicClient instance", () => {
      const client = clientService.getClient();
      expect(client).toBeInstanceOf(Object);
      expect(client).toHaveProperty("readContract");
      expect(client).toHaveProperty("multicall");
      expect(client).toHaveProperty("getStorageAt");
    });
  });

  describe("updateRpcUrl", () => {
    it("should update the client when RPC URL changes", () => {
      const originalClient = clientService.getClient();
      const newRpcUrl = "https://opt-mainnet.g.alchemy.com/v2/test";

      clientService.updateRpcUrl(newRpcUrl);

      const updatedClient = clientService.getClient();
      expect(updatedClient).not.toBe(originalClient);
      expect(updatedClient).toBeDefined();
    });
  });
});
