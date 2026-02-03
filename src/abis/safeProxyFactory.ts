/**
 * SafeProxyFactory ABI - Minimal interface for Safe deployment
 * Based on Safe v1.4.1 deployment
 *
 * Contract address (same across all EVM chains):
 * 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67
 */
export const safeProxyFactoryAbi = [
  {
    name: "createProxyWithNonce",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_singleton", type: "address" },
      { name: "initializer", type: "bytes" },
      { name: "saltNonce", type: "uint256" },
    ],
    outputs: [{ name: "proxy", type: "address" }],
  },
] as const;
