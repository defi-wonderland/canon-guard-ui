/**
 * Signature validation utilities
 * Separated to handle viem imports cleanly
 */

import { keccak256, toBytes, slice } from "viem";

/**
 * Compute the 4-byte selector from a function signature
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns The 4-byte selector (e.g., "0xa9059cbb")
 */
export const computeSelectorFromSignature = (signature: string): string => {
  try {
    const hash = keccak256(toBytes(signature));
    return slice(hash, 0, 4);
  } catch {
    return "";
  }
};

/**
 * Validate that a signature matches an expected selector
 * @param signature - Function signature to validate (e.g., "transfer(address,uint256)")
 * @param expectedSelector - Expected 4-byte selector (e.g., "0xa9059cbb")
 * @returns true if the signature produces the expected selector
 */
export const validateSignatureMatchesSelector = (signature: string, expectedSelector: string): boolean => {
  if (!signature || !expectedSelector) {
    return false;
  }

  const computedSelector = computeSelectorFromSignature(signature);
  const normalizedExpected = expectedSelector.toLowerCase();
  const normalizedComputed = computedSelector.toLowerCase();

  return normalizedExpected === normalizedComputed;
};
