import IActionsBuilderABI from "@defi-wonderland/canon-guard-interfaces/abi/IActionsBuilder.json";
import ISafeEntrypointABI from "@defi-wonderland/canon-guard-interfaces/abi/ISafeEntrypoint.json";
import ISimpleActionsFactoryABI from "@defi-wonderland/canon-guard-interfaces/abi/ISimpleActionsFactory.json";
import ISimpleTransfersFactoryABI from "@defi-wonderland/canon-guard-interfaces/abi/ISimpleTransfersFactory.json";
import { Abi } from "viem";

export const canonGuardEntrypointAbi = ISafeEntrypointABI.abi as Abi;
export const actionBuilderAbi = IActionsBuilderABI.abi as Abi;
export const simpleActionsFactoryAbi = ISimpleActionsFactoryABI.abi as Abi;
export const simpleTransfersFactoryAbi = ISimpleTransfersFactoryABI.abi as Abi;
