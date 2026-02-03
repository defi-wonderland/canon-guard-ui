import { isAddress, isHex } from "viem";

/**
 * Shared validation utilities for form fields.
 * Used across Transfer, Arbitrary Action, and Hub form components.
 */

/**
 * Validates an Ethereum address.
 * Returns true for empty strings (incomplete but not invalid).
 */
export const isValidAddress = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  return isAddress(value);
};

/**
 * Validates a positive numeric amount.
 * Returns true for empty strings (incomplete but not invalid).
 */
export const isValidAmount = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid (just incomplete)
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};

/**
 * Validates hex-encoded data.
 * Returns true for empty strings or "0x" (empty bytes).
 */
export const isValidHexData = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid
  if (value === "0x") return true; // Empty bytes
  return isHex(value);
};

/**
 * Validates a numeric value (can be zero or positive).
 * Returns true for empty strings (incomplete but not invalid).
 */
export const isValidValue = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is not invalid
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && /^[0-9]*\.?[0-9]*$/.test(value);
};
