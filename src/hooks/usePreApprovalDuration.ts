import { useState, useEffect, useMemo } from "react";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import { canonGuardAbi } from "~/abis/canonGuard";
import { humanizeDuration } from "~/hooks/useCanonGuardConfig";
import { DURATION_TIME_MULTIPLIERS, type DurationTimeUnit } from "~/utils/timeUnits";
import type { Address } from "viem";

export interface UsePreApprovalDurationReturn {
  durationAmount: string;
  setDurationAmount: (value: string) => void;
  durationUnit: DurationTimeUnit;
  setDurationUnit: (value: DurationTimeUnit) => void;
  totalDurationSeconds: bigint;
  isValid: boolean;
  errorMessage: string | null;
  maxApprovalDuration: bigint | null;
  isLoading: boolean;
}

export function usePreApprovalDuration(
  guardAddress: Address | null,
  chainId: number | null,
  enabled: boolean = true,
): UsePreApprovalDurationReturn {
  const config = useConfig();

  const [durationAmount, setDurationAmount] = useState<string>("1");
  const [durationUnit, setDurationUnit] = useState<DurationTimeUnit>("hours");
  const [maxApprovalDuration, setMaxApprovalDuration] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMaxDuration = async () => {
      if (!guardAddress || !chainId || !enabled) return;

      setIsLoading(true);
      try {
        const maxDuration = await readContract(config, {
          address: guardAddress,
          abi: canonGuardAbi,
          functionName: "MAX_APPROVAL_DURATION",
          chainId: chainId,
        });
        setMaxApprovalDuration(maxDuration as bigint);
      } catch (error) {
        console.error("[usePreApprovalDuration] Failed to fetch MAX_APPROVAL_DURATION:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaxDuration();
  }, [config, guardAddress, chainId, enabled]);

  const { totalDurationSeconds, isValid, errorMessage } = useMemo(() => {
    const amount = parseFloat(durationAmount) || 0;
    if (amount <= 0) {
      return { totalDurationSeconds: 0n, isValid: false, errorMessage: "Duration must be greater than 0" };
    }

    const multiplier = DURATION_TIME_MULTIPLIERS[durationUnit];
    const totalSeconds = BigInt(Math.floor(amount * multiplier));

    if (maxApprovalDuration !== null && totalSeconds > maxApprovalDuration) {
      const maxHumanized = humanizeDuration(maxApprovalDuration);
      return {
        totalDurationSeconds: totalSeconds,
        isValid: false,
        errorMessage: `Exceeds maximum duration of ${maxHumanized}`,
      };
    }

    return { totalDurationSeconds: totalSeconds, isValid: true, errorMessage: null };
  }, [durationAmount, durationUnit, maxApprovalDuration]);

  return {
    durationAmount,
    setDurationAmount,
    durationUnit,
    setDurationUnit,
    totalDurationSeconds,
    isValid,
    errorMessage,
    maxApprovalDuration,
    isLoading,
  };
}
