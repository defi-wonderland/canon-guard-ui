/**
 * Centralized time unit constants and utilities
 * Used for epoch configuration and pre-approval duration settings
 */

// Epoch time units (for hub configuration) - no seconds option
export type EpochTimeUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const EPOCH_TIME_MULTIPLIERS: Record<EpochTimeUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000, // 30 days
};

// Duration time units (for pre-approval) - includes seconds
export type DurationTimeUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months";

export const DURATION_TIME_MULTIPLIERS: Record<DurationTimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2592000, // 30 days
};

/**
 * Convert a value and time unit to seconds
 */
export const toSeconds = (value: number, unit: EpochTimeUnit | DurationTimeUnit): number => {
  const multipliers: Record<string, number> = { ...EPOCH_TIME_MULTIPLIERS, seconds: 1 };
  return Math.floor(value * multipliers[unit]);
};
