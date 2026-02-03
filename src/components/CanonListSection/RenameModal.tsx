import { useState, useEffect, useRef, useMemo } from "react";
import { Box, styled, CircularProgress } from "@mui/material";
import { XIcon, SquarePenIcon } from "~/components/icons";
import { canonHeaderTokens } from "~/config/themes/safeTheme";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newLabel: string) => void;
  currentLabel: string;
  isLoading?: boolean;
}

export const RenameModal = ({ isOpen, onClose, onSubmit, currentLabel, isLoading = false }: RenameModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Input state - pre-populate with current label
  const [newLabel, setNewLabel] = useState<string>(currentLabel);

  // Validation
  const { isValid, errorMessage } = useMemo(() => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      return { isValid: false, errorMessage: "Name cannot be empty" };
    }
    return { isValid: true, errorMessage: null };
  }, [newLabel]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset state and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewLabel(currentLabel);
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentLabel]);

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onSubmit(newLabel.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer ref={modalRef}>
        <ModalHeader>
          <HeaderLeft>
            <IconWrapper>
              <SquarePenIcon size={18} color={canonHeaderTokens.brand.green} />
            </IconWrapper>
            <ModalTitle>Rename Action</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <XIcon size={18} color={canonHeaderTokens.foreground.accent20} />
          </CloseButton>
        </ModalHeader>

        <ModalDescription>
          Enter a new name for this action. This will update the label in the Canon List.
        </ModalDescription>

        <InputSection>
          <InputLabel>Name</InputLabel>
          <NameInput
            ref={inputRef}
            type='text'
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Enter action name'
            $hasError={!isValid && newLabel !== currentLabel}
            disabled={isLoading}
          />
          {!isValid && errorMessage && newLabel !== currentLabel && (
            <InputError>
              <ErrorText>{errorMessage}</ErrorText>
            </InputError>
          )}
        </InputSection>

        <ButtonRow>
          <CancelButton onClick={onClose} disabled={isLoading}>
            CANCEL
          </CancelButton>
          <SubmitButton onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "SAVE"}
          </SubmitButton>
        </ButtonRow>
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
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "16px",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 8px 10px -6px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
});

const ModalHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 12px 24px",
});

const HeaderLeft = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

const ModalDescription = styled("p")({
  margin: 0,
  padding: "0 24px 20px 24px",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent20,
});

const InputSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "0 24px 24px 24px",
});

const InputLabel = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "16px",
  color: canonHeaderTokens.foreground.accent10,
});

const NameInput = styled("input")<{ $hasError?: boolean }>(({ $hasError }) => ({
  width: "100%",
  height: "40px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: canonHeaderTokens.foreground.accent0,
  backgroundColor: canonHeaderTokens.background.layer0,
  border: `1px solid ${$hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent40}`,
  borderRadius: "6px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease",
  "&:focus": {
    borderColor: $hasError ? canonHeaderTokens.status.red : canonHeaderTokens.foreground.accent20,
  },
  "&::placeholder": {
    color: canonHeaderTokens.foreground.accent30,
  },
  "&:disabled": {
    opacity: 0.6,
    cursor: "not-allowed",
  },
}));

const InputError = styled(Box)({
  display: "flex",
  alignItems: "center",
});

const ErrorText = styled("span")({
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: "16px",
  color: canonHeaderTokens.status.red,
});

const ButtonRow = styled(Box)({
  display: "flex",
  gap: "12px",
  padding: "0 24px 24px 24px",
});

const CancelButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: "transparent",
  color: canonHeaderTokens.foreground.accent10,
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: `1px solid ${canonHeaderTokens.foreground.accent40}`,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: disabled ? "transparent" : canonHeaderTokens.background.layer1Variation,
  },
}));

const SubmitButton = styled("button")<{ disabled?: boolean }>(({ disabled }) => ({
  flex: 1,
  height: "44px",
  padding: "12px 24px",
  borderRadius: "100px",
  backgroundColor: disabled ? canonHeaderTokens.foreground.accent40 : canonHeaderTokens.brand.green,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  transition: "opacity 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    opacity: disabled ? 0.6 : 0.9,
  },
}));
