/**
 * WalletConnect Provider
 * Acts as a WalletConnect receiver/wallet to accept transaction requests from dApps
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import SignClient from "@walletconnect/sign-client";
import { getSdkError } from "@walletconnect/utils";
import { useStateContext } from "~/hooks/useStateContext";
import type { SessionTypes, SignClientTypes } from "@walletconnect/types";

// Get project ID from environment
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// App metadata for WalletConnect
const APP_METADATA: SignClientTypes.Metadata = {
  name: "Canon Guard",
  description: "Canon Guard - Safe Transaction Guard",
  url: typeof window !== "undefined" ? window.location.origin : "https://canon.defi.sucks",
  icons: ["https://canon.defi.sucks/icon.png"],
};

// Transaction request from WalletConnect
export interface WalletConnectTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gas?: string;
  gasPrice?: string;
}

// Parsed transaction ready for ArbitraryAction form
export interface ParsedWalletConnectTransaction {
  target: string;
  data: string; // Full calldata including selector
  value: string;
  requestId?: number;
  topic?: string;
  dappName?: string; // Name of the connected dApp
}

interface WalletConnectContextType {
  // Connection state
  isInitialized: boolean;
  isPairing: boolean;
  pairingError: string | null;
  sessions: SessionTypes.Struct[];

  // Actions
  pairWithUri: (uri: string) => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
  clearPairingError: () => void;

  // Modal state
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  // Pending transaction (set when a dApp sends a tx request)
  pendingTransaction: ParsedWalletConnectTransaction | null;
  clearPendingTransaction: () => void;
}

const WalletConnectContext = createContext<WalletConnectContextType | null>(null);

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used within WalletConnectProvider");
  }
  return context;
};

interface WalletConnectProviderProps {
  children: ReactNode;
}

export const WalletConnectProvider = ({ children }: WalletConnectProviderProps) => {
  const { chainId, safeAddress } = useStateContext();

  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedWalletConnectTransaction | null>(null);

  // Use refs to access current values in event handlers without re-registering
  const chainIdRef = useRef(chainId);
  const safeAddressRef = useRef(safeAddress);

  // Keep refs in sync
  useEffect(() => {
    chainIdRef.current = chainId;
    safeAddressRef.current = safeAddress;
  }, [chainId, safeAddress]);

  // Initialize SignClient
  useEffect(() => {
    if (!PROJECT_ID) {
      console.warn("[WalletConnect] No project ID configured");
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        const client = await SignClient.init({
          projectId: PROJECT_ID,
          metadata: APP_METADATA,
        });

        if (!mounted) return;

        // Set up event listeners BEFORE setting state to ensure they're ready
        client.on("session_proposal", async (proposal) => {
          console.log("[WalletConnect] Session proposal received:", proposal);

          const { id, params } = proposal;
          const { requiredNamespaces, optionalNamespaces } = params;

          try {
            // Build namespaces based on required and optional namespaces
            const namespaces: SessionTypes.Namespaces = {};
            const currentChainId = chainIdRef.current || 1;
            const currentSafeAddress = safeAddressRef.current || "0x0000000000000000000000000000000000000000";
            const currentChain = `eip155:${currentChainId}`;
            const currentAccount = `${currentChain}:${currentSafeAddress}`;

            // Process required namespaces
            if (requiredNamespaces && Object.keys(requiredNamespaces).length > 0) {
              for (const [key, value] of Object.entries(requiredNamespaces)) {
                if (key === "eip155" || key.startsWith("eip155:")) {
                  const chains = value.chains || [currentChain];
                  const accounts = chains.map((chain) => `${chain}:${currentSafeAddress}`);

                  namespaces[key] = {
                    accounts,
                    methods: value.methods || [],
                    events: value.events || [],
                    chains,
                  };
                }
              }
            }

            // Process optional namespaces if no required ones
            if (Object.keys(namespaces).length === 0 && optionalNamespaces) {
              for (const [key, value] of Object.entries(optionalNamespaces)) {
                if (key === "eip155" || key.startsWith("eip155:")) {
                  const chains = value.chains || [currentChain];
                  const accounts = chains.map((chain) => `${chain}:${currentSafeAddress}`);

                  namespaces[key] = {
                    accounts,
                    methods: value.methods || [],
                    events: value.events || [],
                    chains,
                  };
                }
              }
            }

            // If still empty, create a default namespace
            if (Object.keys(namespaces).length === 0) {
              namespaces["eip155"] = {
                accounts: [currentAccount],
                methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData", "eth_signTypedData_v4"],
                events: ["chainChanged", "accountsChanged"],
                chains: [currentChain],
              };
            }

            console.log("[WalletConnect] Approving with namespaces:", namespaces);

            const session = await client.approve({
              id,
              namespaces,
            });

            console.log("[WalletConnect] Session approved:", session);

            // Wait for session to be acknowledged
            await session.acknowledged();
            console.log("[WalletConnect] Session acknowledged");

            // Refresh sessions from client to get complete data
            const updatedSessions = client.session.getAll();
            setSessions(updatedSessions);
            setPairingError(null);
          } catch (error) {
            console.error("[WalletConnect] Failed to approve session:", error);
            setPairingError("Failed to approve session");
            try {
              await client.reject({
                id,
                reason: getSdkError("USER_REJECTED"),
              });
            } catch (rejectError) {
              console.error("[WalletConnect] Failed to reject session:", rejectError);
            }
          }
        });

        client.on("session_request", async (event) => {
          const { topic, params, id } = event;
          const { request } = params;

          console.log("[WalletConnect] Session request:", request.method, params);

          // Get dApp name from session
          const session = client.session.get(topic);
          const dappName = session?.peer?.metadata?.name || "Unknown App";

          if (request.method === "eth_sendTransaction") {
            const tx = request.params[0] as WalletConnectTransaction;

            // Validate the transaction is for our Safe
            const currentSafe = safeAddressRef.current;
            if (currentSafe && tx.from.toLowerCase() !== currentSafe.toLowerCase()) {
              console.warn("[WalletConnect] Transaction from address doesn't match Safe:", tx.from, currentSafe);
            }

            // Parse the transaction - pass full calldata directly
            const parsed: ParsedWalletConnectTransaction = {
              target: tx.to,
              data: tx.data || "0x", // Full calldata including selector
              value: tx.value || "0",
              requestId: id,
              topic,
              dappName,
            };

            setPendingTransaction(parsed);
            setIsModalOpen(false);

            // Reject the request in WalletConnect (we handle it through Canon Guard flow)
            try {
              await client.respond({
                topic,
                response: {
                  id,
                  jsonrpc: "2.0",
                  error: getSdkError("USER_REJECTED"),
                },
              });
            } catch (error) {
              console.error("[WalletConnect] Failed to respond to request:", error);
            }
          } else {
            // Reject unsupported methods
            try {
              await client.respond({
                topic,
                response: {
                  id,
                  jsonrpc: "2.0",
                  error: getSdkError("UNSUPPORTED_METHODS"),
                },
              });
            } catch (error) {
              console.error("[WalletConnect] Failed to reject unsupported method:", error);
            }
          }
        });

        client.on("session_delete", (event) => {
          console.log("[WalletConnect] Session deleted:", event.topic);
          setSessions((prev) => prev.filter((s) => s.topic !== event.topic));
        });

        setSignClient(client);
        setIsInitialized(true);

        // Load existing sessions
        const existingSessions = client.session.getAll();
        setSessions(existingSessions);

        console.log("[WalletConnect] Initialized with", existingSessions.length, "existing sessions");
      } catch (error) {
        console.error("[WalletConnect] Failed to initialize:", error);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Pair with URI from dApp
  const pairWithUri = useCallback(
    async (uri: string) => {
      if (!signClient) {
        setPairingError("WalletConnect not initialized");
        return;
      }

      if (!uri.startsWith("wc:")) {
        setPairingError("Invalid WalletConnect URI");
        return;
      }

      setIsPairing(true);
      setPairingError(null);

      try {
        await signClient.pair({ uri });
        console.log("[WalletConnect] Pairing initiated with URI");
        // Session approval happens in session_proposal handler
      } catch (error) {
        console.error("[WalletConnect] Failed to pair:", error);
        setPairingError(error instanceof Error ? error.message : "Failed to connect");
      } finally {
        setIsPairing(false);
      }
    },
    [signClient],
  );

  // Disconnect a specific session
  const disconnect = useCallback(
    async (topic: string) => {
      if (!signClient) return;

      // First remove from local state
      setSessions((prev) => prev.filter((s) => s.topic !== topic));

      // Check if session exists before trying to disconnect
      const sessionExists = signClient.session.keys.includes(topic);
      if (!sessionExists) {
        console.log("[WalletConnect] Session already removed:", topic);
        return;
      }

      try {
        await signClient.disconnect({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
        console.log("[WalletConnect] Disconnected session:", topic);
      } catch {
        // Session might have been removed by the dApp already
        console.log("[WalletConnect] Session disconnect handled:", topic);
      }
    },
    [signClient],
  );

  // Disconnect all sessions
  const disconnectAll = useCallback(async () => {
    if (!signClient) return;

    for (const session of sessions) {
      await disconnect(session.topic);
    }
  }, [signClient, sessions, disconnect]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setPairingError(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const clearPairingError = useCallback(() => {
    setPairingError(null);
  }, []);

  const clearPendingTransaction = useCallback(() => {
    setPendingTransaction(null);
  }, []);

  const value: WalletConnectContextType = {
    isInitialized,
    isPairing,
    pairingError,
    sessions,
    pairWithUri,
    disconnect,
    disconnectAll,
    clearPairingError,
    isModalOpen,
    openModal,
    closeModal,
    pendingTransaction,
    clearPendingTransaction,
  };

  return <WalletConnectContext.Provider value={value}>{children}</WalletConnectContext.Provider>;
};
