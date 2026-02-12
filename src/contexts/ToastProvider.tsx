import { ReactNode, useCallback, useMemo, useState } from "react";
import { Alert, Link, Snackbar } from "@mui/material";
import { ToastContext, ToastInput, ToastItem } from "./toastContext";
import type { SnackbarCloseReason } from "@mui/material";

const TOAST_AUTO_HIDE_MS = 5000;
const TOAST_VERTICAL_SPACING = 72;
const TOAST_BOTTOM_OFFSET = 24;

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleToastClose = useCallback(
    (id: number, reason?: SnackbarCloseReason) => {
      // Keep toast visible when user clicks elsewhere.
      if (reason === "clickaway") {
        return;
      }
      removeToast(id);
    },
    [removeToast],
  );

  const showToast = useCallback((toast: ToastInput, severity: ToastItem["severity"]) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), severity, ...toast }]);
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
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={TOAST_AUTO_HIDE_MS}
          onClose={(_, reason) => handleToastClose(toast.id, reason)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            "&.MuiSnackbar-root": {
              bottom: `${TOAST_BOTTOM_OFFSET + index * TOAST_VERTICAL_SPACING}px !important`,
            },
          }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.severity}
            variant='filled'
            sx={{ width: "100%", alignItems: "center", "& .MuiAlert-action": { padding: "0 8px" } }}
            action={
              toast.actionLink ? (
                <Link
                  href={toast.actionLink.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  underline='hover'
                  color='inherit'
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {toast.actionLink.label}
                </Link>
              ) : undefined
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};
