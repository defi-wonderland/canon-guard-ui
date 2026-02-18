import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Box, IconButton, Snackbar, styled, Typography } from "@mui/material";
import { ExternalLink, X } from "lucide-react";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { ToastContext, ToastInput, ToastItem, ToastSeverity } from "./toastContext";
import type { SnackbarCloseReason } from "@mui/material";

const TOAST_AUTO_HIDE_MS = 10000;
const TOAST_WIDTH = 340;
const TOAST_VERTICAL_SPACING = 90;
const TOAST_BOTTOM_OFFSET = 24;

const ACCENT_COLORS: Record<ToastSeverity, string> = {
  success: canonHeaderTokens.brand.green,
  error: canonHeaderTokens.status.red,
};

const TITLE_LABELS: Record<ToastSeverity, string> = {
  success: "Success",
  error: "Error",
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextToastIdRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleToastClose = useCallback(
    (id: number, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      removeToast(id);
    },
    [removeToast],
  );

  const showToast = useCallback((toast: ToastInput, severity: ToastItem["severity"]) => {
    const toastId = nextToastIdRef.current;
    nextToastIdRef.current += 1;

    setToasts((prev) => [...prev, { id: toastId, severity, ...toast }]);
  }, []);

  const showSuccess = useCallback(
    (toast: ToastInput) => {
      showToast(toast, "success");
    },
    [showToast],
  );

  const showError = useCallback(
    (toast: ToastInput) => {
      showToast(toast, "error");
    },
    [showToast],
  );

  const contextValue = useMemo(
    () => ({
      showSuccess,
      showError,
    }),
    [showSuccess, showError],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast, index) => (
        <StyledSnackbar
          key={toast.id}
          open
          autoHideDuration={TOAST_AUTO_HIDE_MS}
          onClose={(_, reason) => handleToastClose(toast.id, reason)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          style={{
            bottom: `${TOAST_BOTTOM_OFFSET + index * TOAST_VERTICAL_SPACING}px`,
          }}
        >
          <ToastContainer>
            <AccentBar style={{ backgroundColor: ACCENT_COLORS[toast.severity] }} />

            <ToastContent>
              <TitleRow>
                <ToastTitle style={{ color: ACCENT_COLORS[toast.severity] }}>{TITLE_LABELS[toast.severity]}</ToastTitle>
                {toast.actionLink && (
                  <LinkButton
                    size='small'
                    aria-label={toast.actionLink.label}
                    onClick={() => window.open(toast.actionLink!.href, "_blank", "noopener,noreferrer")}
                    style={{ color: ACCENT_COLORS[toast.severity] }}
                  >
                    <ExternalLink size={14} />
                  </LinkButton>
                )}
              </TitleRow>

              <ToastMessage variant='body2'>{toast.message}</ToastMessage>
            </ToastContent>

            <CloseButton size='small' aria-label='Close' onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </CloseButton>
          </ToastContainer>
        </StyledSnackbar>
      ))}
    </ToastContext.Provider>
  );
};

// --- Styled components ---

const StyledSnackbar = styled(Snackbar)({
  "&.MuiSnackbar-root": {
    width: TOAST_WIDTH,
  },
});

const ToastContainer = styled(Box)({
  display: "flex",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
});

const AccentBar = styled("span")({
  width: 4,
  flexShrink: 0,
});

const ToastContent = styled(Box)({
  flex: 1,
  padding: "12px 8px 12px 12px",
  minWidth: 0,
});

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginBottom: "2px",
});

const ToastTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: "0.85rem",
});

const ToastMessage = styled(Typography)({
  color: canonHeaderTokens.foreground.accent10,
  fontSize: "0.8rem",
});

const LinkButton = styled(IconButton)({
  padding: "2px",
});

const CloseButton = styled(IconButton)({
  alignSelf: "flex-start",
  marginTop: "8px",
  marginRight: "8px",
  padding: "2px",
  color: canonHeaderTokens.foreground.accent20,
  "&:hover": {
    color: canonHeaderTokens.foreground.accent0,
  },
});
