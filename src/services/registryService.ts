/**
 * Registry Service - Handles fetching and processing registered entities from CanonGuardRegistry
 *
 * Uses viem's multicall to batch PARENT() and approvalExpiries() calls for efficiency
 */

import { Address, PublicClient, erc20Abi } from "viem";
import {
  canonGuardRegistryAbi,
  actionBuilderParentAbi,
  approvalExpiriesAbi,
  cappedTokenTransfersHubAbi,
} from "../abis/canonGuard";
import { CANON_GUARD_REGISTRY, KNOWN_FACTORY_MAPPINGS, isHubFactory, getHubFactoryType } from "../constants/canonGuard";
import { ActionFactoryType, HubFactoryType, CappedTokenTransfersHubInfo, HubTokenConfig } from "../types/canon-guard";
import { ClientService } from "./clientService";

export interface RegisteredEntity {
  address: Address;
  label: string;
  factoryType: ActionFactoryType;
  factoryLabel: string;
  isFastPath: boolean;
  lastEditedAt: Date;
  // Hub-related fields
  isHub: boolean;
  hubType?: HubFactoryType;
  parentHubAddress?: Address; // For children: the hub address this child belongs to
  childrenCount?: number; // For hubs: number of children
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

      // Determine factory type and hub status from PARENT() result
      let factoryType = ActionFactoryType.UNKNOWN;
      let factoryLabel = "Unknown";
      let isHub = false;
      let hubType: HubFactoryType | undefined;
      let parentHubAddress: Address | undefined;

      if (parentResult.status === "success" && parentResult.result) {
        const parentAddress = parentResult.result as Address;

        // Check if this is a hub (parent is a hub factory)
        if (isHubFactory(parentAddress)) {
          isHub = true;
          hubType = getHubFactoryType(parentAddress) ?? undefined;
          factoryType = ActionFactoryType.CAPPED_TOKEN_TRANSFERS;
          factoryLabel = "Capped Token Transfers Hub";
        } else {
          // Check if parent is a known factory
          const mapping = KNOWN_FACTORY_MAPPINGS[parentAddress];
          if (mapping) {
            factoryType = mapping.type;
            factoryLabel = mapping.label;
          } else {
            // Parent is not a known factory - could be a hub (this entity is a child)
            // We'll check later if any hub contains this as a child
            parentHubAddress = parentAddress;
          }
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
        isHub,
        hubType,
        parentHubAddress,
      });
    }

    // Second pass: identify hub children and count children for hubs
    // Build a map of hub addresses to their entities
    const hubAddresses = enrichedEntities.filter((e) => e.isHub).map((e) => e.address);

    // For entities that have a parentHubAddress, check if it's a hub in our list
    for (const entity of enrichedEntities) {
      if (entity.parentHubAddress && hubAddresses.includes(entity.parentHubAddress)) {
        // This is a child of a hub - update its factory type
        entity.factoryType = ActionFactoryType.CAPPED_TOKEN_TRANSFERS;
        entity.factoryLabel = "Capped Transfer";
      }
    }

    // Count children for each hub
    for (const hub of enrichedEntities.filter((e) => e.isHub)) {
      hub.childrenCount = enrichedEntities.filter((e) => e.parentHubAddress === hub.address).length;
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

  /**
   * Fetch hub configuration for a CappedTokenTransfersHub
   * Includes tokens, caps, cap remaining, recipient, and epoch length
   */
  async getHubConfiguration(hubAddress: Address): Promise<CappedTokenTransfersHubInfo | null> {
    try {
      // First, fetch basic hub info and token list
      const [recipient, epochLength, tokens] = await Promise.all([
        this.client.readContract({
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "RECIPIENT",
        }) as Promise<Address>,
        this.client.readContract({
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "EPOCH_LENGTH",
        }) as Promise<bigint>,
        this.client.readContract({
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "tokens",
        }) as Promise<Address[]>,
      ]);

      if (!tokens || tokens.length === 0) {
        return {
          address: hubAddress,
          recipient,
          epochLength,
          tokens: [],
        };
      }

      // Fetch cap, capLeft, and decimals for each token using multicall
      const tokenContracts = tokens.flatMap((token) => [
        {
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "cap" as const,
          args: [token],
        },
        {
          address: hubAddress,
          abi: cappedTokenTransfersHubAbi,
          functionName: "capLeft" as const,
          args: [token],
        },
        {
          address: token,
          abi: erc20Abi,
          functionName: "decimals" as const,
        },
      ]);

      const tokenResults = await this.client.multicall({
        contracts: tokenContracts,
        allowFailure: true,
      });

      const tokenConfigs: HubTokenConfig[] = tokens.map((tokenAddress, index) => {
        const capResult = tokenResults[index * 3];
        const capLeftResult = tokenResults[index * 3 + 1];
        const decimalsResult = tokenResults[index * 3 + 2];

        return {
          address: tokenAddress,
          cap: capResult.status === "success" ? (capResult.result as bigint) : 0n,
          capLeft: capLeftResult.status === "success" ? (capLeftResult.result as bigint) : 0n,
          decimals: decimalsResult.status === "success" ? (decimalsResult.result as number) : 18,
        };
      });

      return {
        address: hubAddress,
        recipient,
        epochLength,
        tokens: tokenConfigs,
      };
    } catch (error) {
      console.error("Failed to fetch hub configuration:", error);
      return null;
    }
  }

  /**
   * Check if an address is a child of a specific hub
   */
  async isHubChild(hubAddress: Address, childAddress: Address): Promise<boolean> {
    try {
      const result = await this.client.readContract({
        address: hubAddress,
        abi: cappedTokenTransfersHubAbi,
        functionName: "isHubChild",
        args: [childAddress],
      });

      return result as boolean;
    } catch (error) {
      console.error("Failed to check if address is hub child:", error);
      return false;
    }
  }
}
