import { useCanonGuardConfigContext, CanonGuardConfigState } from "~/contexts";

// Re-export the type for backwards compatibility
export type CanonGuardConfig = CanonGuardConfigState;

/**
 * Humanize seconds into a readable duration string
 * Examples: 3600 -> "1 hour", 604800 -> "7 days", 31536000 -> "365 days"
 */
export const humanizeDuration = (seconds: bigint | null): string => {
  if (seconds === null) return "-";

  const secs = Number(seconds);

  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);

  if (days > 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return `${secs} seconds`;
};

/**
 * Hook to access Canon Guard configuration.
 * Delegates to the context provider for shared state.
 */
export const useCanonGuardConfig = (): CanonGuardConfig => {
  return useCanonGuardConfigContext();
};
