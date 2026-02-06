/**
 * WalletConnect Modal
 * Input field for pasting WalletConnect URI from dApps
 */

import { useRef, useEffect, useState } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { XIcon } from "~/components/icons";
import { WalletConnectIcon } from "~/components/icons/WalletConnectIcon";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { useWalletConnect } from "~/providers/WalletConnectProvider";

export const WalletConnectModal = () => {
  const { isModalOpen, closeModal, isPairing, pairingError, sessions, disconnect, pairWithUri, clearPairingError } =
    useWalletConnect();

  const [pairingCode, setPairingCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (isModalOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, closeModal]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, closeModal]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPairingCode(text);
      clearPairingError();

      // Auto-connect if it looks like a valid WC URI
      if (text.startsWith("wc:")) {
        await pairWithUri(text);
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPairingCode(value);
    clearPairingError();

    // Auto-connect when a valid WC URI is pasted/typed
    if (value.startsWith("wc:") && value.includes("@")) {
      pairWithUri(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pairingCode.startsWith("wc:")) {
      pairWithUri(pairingCode);
    }
  };

  // Handle disconnect and clear the pairing code
  const handleDisconnect = async (topic: string) => {
    await disconnect(topic);
    setPairingCode(""); // Clear the old URI when disconnecting
  };

  if (!isModalOpen) return null;

  const hasActiveSessions = sessions.length > 0;

  return (
    <Overlay>
      <ModalContainer ref={modalRef}>
        <ModalHeader>
          <HeaderLeft>
            <WalletConnectIcon size={24} color={canonHeaderTokens.brand.green} />
            <ModalTitle>WalletConnect</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={closeModal}>
            <XIcon size={18} color={canonHeaderTokens.foreground.accent20} />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          {/* Active Sessions Section */}
          {hasActiveSessions && (
            <SessionsSection>
              <SectionLabel>CONNECTED DAPPS</SectionLabel>
              {sessions.map((session) => (
                <SessionItem key={session.topic}>
                  <SessionInfo>
                    <SessionName>{session.peer?.metadata?.name || "Unknown dApp"}</SessionName>
                    <SessionUrl>{session.peer?.metadata?.url || session.topic.slice(0, 20) + "..."}</SessionUrl>
                  </SessionInfo>
                  <DisconnectButton onClick={() => handleDisconnect(session.topic)}>Disconnect</DisconnectButton>
                </SessionItem>
              ))}
            </SessionsSection>
          )}

          {/* Pairing Code Input Section - only show when not connected */}
          {!hasActiveSessions && (
            <PairingSection>
              <InstructionText>Paste the pairing code below to connect to your dApp via WalletConnect</InstructionText>

              <InputWrapper $hasError={!!pairingError}>
                <InputLabel $hasError={!!pairingError}>Pairing code</InputLabel>
                <InputRow>
                  <PairingInput
                    ref={inputRef}
                    type='text'
                    value={pairingCode}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder='wc:a1b2c3...'
                    disabled={isPairing}
                  />
                  <PasteButton onClick={handlePaste} disabled={isPairing}>
                    {isPairing ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Paste"}
                  </PasteButton>
                </InputRow>
              </InputWrapper>

              {pairingError && <ErrorText>{pairingError}</ErrorText>}

              <HelpSection>
                <HelpTitle>How do I connect to a dApp?</HelpTitle>
                <HelpText>
                  1. Open a dApp and click "Connect Wallet"
                  <br />
                  2. Select WalletConnect
                  <br />
                  3. Copy the pairing code or scan QR with your phone
                  <br />
                  4. Paste the code here
                </HelpText>
              </HelpSection>
            </PairingSection>
          )}
        </ModalContent>
      </ModalContainer>
    </Overlay>
  );
};

const Overlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

const ModalContainer = styled(Box)({
  width: "420px",
  maxHeight: "90vh",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 8px 10px -6px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

const ModalHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 16px 24px",
  borderBottom: `1px solid ${canonHeaderTokens.foreground.accent40}`,
});

const HeaderLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const ModalTitle = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "24px",
  color: canonHeaderTokens.foreground.accent0,
});

const CloseButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
  },
});

const ModalContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "20px 24px 24px 24px",
  overflowY: "auto",
});

const SessionsSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const SectionLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  lineHeight: "12px",
  letterSpacing: "0.5px",
  color: canonHeaderTokens.foreground.accent30,
  textTransform: "uppercase",
});

const SessionItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  backgroundColor: canonHeaderTokens.background.layer0,
  borderRadius: "8px",
});

const SessionInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flex: 1,
  minWidth: 0,
});

const SessionName = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const SessionUrl = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent20,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const DisconnectButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  backgroundColor: "transparent",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  color: canonHeaderTokens.foreground.accent20,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: canonHeaderTokens.background.layer1Variation,
    borderColor: canonHeaderTokens.foreground.accent30,
    color: canonHeaderTokens.foreground.accent10,
  },
});

const PairingSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const InstructionText = styled("p")({
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const InputWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$hasError",
})<{ $hasError?: boolean }>(({ $hasError }) => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: "12px 16px",
  backgroundColor: canonHeaderTokens.background.layer0,
  borderRadius: "8px",
  border: `1px solid ${$hasError ? "#ff6b6b" : canonHeaderTokens.brand.green}`,
}));

const InputLabel = styled("span", {
  shouldForwardProp: (prop) => prop !== "$hasError",
})<{ $hasError?: boolean }>(({ $hasError }) => ({
  position: "absolute",
  top: "-8px",
  left: "12px",
  padding: "0 4px",
  backgroundColor: canonHeaderTokens.background.layer0,
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "16px",
  color: $hasError ? "#ff6b6b" : canonHeaderTokens.brand.green,
}));

const InputRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const PairingInput = styled("input")({
  flex: 1,
  backgroundColor: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  "&:disabled": {
    opacity: 0.6,
  },
});

const PasteButton = styled("button")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 16px",
  backgroundColor: canonHeaderTokens.brand.green,
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  color: "#000",
  transition: "opacity 0.2s ease",
  "&:hover:not(:disabled)": {
    opacity: 0.9,
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
});

const ErrorText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "18px",
  color: "#ff6b6b",
});

const HelpSection = styled(Box)({
  padding: "16px",
  backgroundColor: canonHeaderTokens.background.layer0,
  borderRadius: "8px",
});

const HelpTitle = styled("span")({
  display: "block",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "18px",
  color: canonHeaderTokens.foreground.accent10,
  marginBottom: "8px",
});

const HelpText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});
