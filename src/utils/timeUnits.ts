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
