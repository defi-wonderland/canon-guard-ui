/**
 * Registry Service - Handles fetching and processing registered entities from CanonGuardRegistry
 *
 * Uses viem's multicall to batch PARENT() and approvalExpiries() calls for efficiency
 */

import { Address, PublicClient } from "viem";
import { canonGuardRegistryAbi, actionBuilderParentAbi, approvalExpiriesAbi } from "../abis/canonGuard";
import { CANON_GUARD_REGISTRY, KNOWN_FACTORY_MAPPINGS } from "../constants/canonGuard";
import { ActionFactoryType } from "../types/canon-guard";
import { ClientService } from "./clientService";

export interface RegisteredEntity {
  address: Address;
  label: string;
  factoryType: ActionFactoryType;
  factoryLabel: string;
  isFastPath: boolean;
  lastEditedAt: Date;
}

interface RegistryEntity {
  entity: Address;
  edition: {
    label: string;
    lastEditedAt: bigint;
  };
}

export class RegistryService {
  private clientService: ClientService;

  constructor(clientService: ClientService) {
    this.clientService = clientService;
  }

  private get client(): PublicClient {
    return this.clientService.getClient();
  }

  /**
   * Fetch all registered entities from the CanonGuardRegistry
   * Uses multicall to batch PARENT() and approvalExpiries() calls
   */
  async getRegisteredEntities(
    guardAddress: Address,
    entrypointAddress: Address,
    offset: number = 0,
    limit: number = 100,
  ): Promise<RegisteredEntity[]> {
    try {
      // Step 1: Fetch entities from registry
      const entities = await this.fetchEntitiesFromRegistry(guardAddress, offset, limit);

      if (entities.length === 0) {
        return [];
      }

      // Step 2: Batch fetch PARENT() and approvalExpiries() using multicall
      const enrichedEntities = await this.enrichEntitiesWithMulticall(entities, entrypointAddress);

      return enrichedEntities;
    } catch (error) {
      console.error("Failed to fetch registered entities:", error);
      return [];
    }
  }

  /**
   * Fetch raw entities from the registry contract
   */
  private async fetchEntitiesFromRegistry(
    guardAddress: Address,
    offset: number,
    limit: number,
  ): Promise<RegistryEntity[]> {
    try {
      const result = await this.client.readContract({
        address: CANON_GUARD_REGISTRY,
        abi: canonGuardRegistryAbi,
        functionName: "read",
        args: [guardAddress, BigInt(offset), BigInt(limit)],
      });

      // Type assertion - result should be an array of entities
      const entities = result as RegistryEntity[];
      return entities;
    } catch (error) {
      console.error("Failed to read from registry:", error);
      return [];
    }
  }

  /**
   * Enrich entities with factory type and fast-path status using a single multicall
   * This batches 2N calls (N PARENT() + N approvalExpiries()) into 1 RPC request
   */
  private async enrichEntitiesWithMulticall(
    entities: RegistryEntity[],
    entrypointAddress: Address,
  ): Promise<RegisteredEntity[]> {
    // Build the multicall contracts array
    // For each entity, we need: PARENT() and approvalExpiries()
    // Results will be interleaved: [parent1, approval1, parent2, approval2, ...]
    const contracts = entities.flatMap((entity) => [
      {
        address: entity.entity,
        abi: actionBuilderParentAbi,
        functionName: "PARENT" as const,
      },
      {
        address: entrypointAddress,
        abi: approvalExpiriesAbi,
        functionName: "approvalExpiries" as const,
        args: [entity.entity],
      },
    ]);

    // Execute multicall
    const results = await this.client.multicall({
      contracts,
      allowFailure: true,
    });

    const now = Math.floor(Date.now() / 1000);
    const enrichedEntities: RegisteredEntity[] = [];

    // Process results - they come back interleaved
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const parentResult = results[i * 2];
      const approvalResult = results[i * 2 + 1];

      // Determine factory type from PARENT() result
      let factoryType = ActionFactoryType.UNKNOWN;
      let factoryLabel = "Unknown";

      if (parentResult.status === "success" && parentResult.result) {
        const parentAddress = parentResult.result as Address;
        const mapping = KNOWN_FACTORY_MAPPINGS[parentAddress];
        if (mapping) {
          factoryType = mapping.type;
          factoryLabel = mapping.label;
        }
      }

      // Determine fast-path status from approvalExpiries()
      // Fast-path if approval is not expired (and not 0)
      let isFastPath = false;
      if (approvalResult.status === "success" && approvalResult.result) {
        const expiryTimestamp = Number(approvalResult.result as bigint);
        isFastPath = expiryTimestamp > 0 && expiryTimestamp > now;
      }

      enrichedEntities.push({
        address: entity.entity,
        label: entity.edition.label || "Untitled Transaction",
        factoryType,
        factoryLabel,
        isFastPath,
        lastEditedAt: new Date(Number(entity.edition.lastEditedAt) * 1000),
      });
    }

    return enrichedEntities;
  }

  /**
   * Get the total count of entities for a guard address
   */
  async getTotalEntities(guardAddress: Address): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: CANON_GUARD_REGISTRY,
        abi: canonGuardRegistryAbi,
        functionName: "totalEntities",
        args: [guardAddress],
      });

      return Number(result as bigint);
    } catch (error) {
      console.error("Failed to get total entities:", error);
      return 0;
    }
  }
}
