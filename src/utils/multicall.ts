import { MulticallReturnType } from "viem";

export function parseMulticallResults(results: MulticallReturnType): unknown[] {
  if (!results) return [];

  const values = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === "success") {
      values.push(result.result);
    } else {
      values.push(null);
    }
  }
  return values;
}

export function parseMulticallResultsStrict(results: MulticallReturnType, errorContexts?: string[]): unknown[] {
  if (!results) return [];

  const values = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === "success") {
      values.push(result.result);
    } else if (errorContexts && errorContexts[i]) {
      const error = result?.error?.message || "Unknown error";
      throw new Error(`${errorContexts[i]}: ${error}`);
    } else {
      values.push(null);
    }
  }
  return values;
}
