import { useCanonGuardConfigContext, CanonGuardConfigState } from "~/contexts";

// Re-export the type for backwards compatibility
export type CanonGuardConfig = CanonGuardConfigState;

/**
 * Humanize seconds into a readable duration string.
 * Shows only one unit with appropriate rounding.
 *
 * Examples:
 * - 3600 -> "1 hour"
 * - 7200 -> "2 hours"
 * - 86400 -> "1 day"
 * - 604800 -> "7 days"
 * - 2592000 -> "1 month" (30 days)
 * - 31536000 -> "12 months" (365 days)
 */
export const humanizeDuration = (seconds: bigint | null): string => {
  if (seconds === null) return "-";

  const secs = Number(seconds);

  if (secs === 0) return "0 seconds";

  const MINUTE = 60;
  const HOUR = 3600;
  const DAY = 86400;
  const MONTH = 30 * DAY; // 30 days

  // For values >= 30 days, show months
  if (secs >= MONTH) {
    const months = Math.round(secs / MONTH);
    return months === 1 ? "1 month" : `${months} months`;
  }

  // For values >= 1 day, show days
  if (secs >= DAY) {
    const days = Math.round(secs / DAY);
    return days === 1 ? "1 day" : `${days} days`;
  }

  // For values >= 1 hour, show hours
  if (secs >= HOUR) {
    const hours = Math.round(secs / HOUR);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  // For values >= 1 minute, show minutes
  if (secs >= MINUTE) {
    const minutes = Math.round(secs / MINUTE);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }

  // For values < 1 minute, show seconds
  return secs === 1 ? "1 second" : `${secs} seconds`;
};

/**
 * Hook to access Canon Guard configuration.
 * Delegates to the context provider for shared state.
 */
export const useCanonGuardConfig = (): CanonGuardConfig => {
  return useCanonGuardConfigContext();
};
