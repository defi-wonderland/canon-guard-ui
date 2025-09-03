/**
 * Client Service - Centralized PublicClient Management
 *
 * Responsibilities:
 * - Create and manage viem PublicClient instances
 * - Avoid duplication of client creation logic
 * - Provide consistent client configuration across services
 */

import { createPublicClient, http, PublicClient, Chain } from "viem";

export class ClientService {
  private client: PublicClient;
  private chain: Chain;
  private rpcUrl: string;

  constructor(rpcUrl: string, chain: Chain) {
    this.chain = chain;
    this.rpcUrl = rpcUrl;
    this.client = this.createPublicClient(rpcUrl);
  }

  getClient(): PublicClient {
    return this.client;
  }

  getChain(): Chain {
    return this.chain;
  }

  private createPublicClient(rpcUrl: string): PublicClient {
    return createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl),
    }) as PublicClient;
  }

  updateRpcUrl(rpcUrl: string): void {
    this.rpcUrl = rpcUrl;
    this.client = this.createPublicClient(rpcUrl);
  }

  updateChain(chain: Chain): void {
    this.chain = chain;
    this.client = this.createPublicClient(this.rpcUrl);
  }
}
