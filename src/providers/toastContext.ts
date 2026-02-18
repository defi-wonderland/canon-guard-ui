import { createContext } from "react";

export type ToastSeverity = "success" | "error";

interface ToastActionLink {
  label: string;
  href: string;
}

export interface ToastInput {
  message: string;
  actionLink?: ToastActionLink;
}

export interface ToastItem {
  id: number;
  message: string;
  severity: ToastSeverity;
  actionLink?: ToastActionLink;
}

export interface ToastContextValue {
  showSuccess: (toast: ToastInput) => void;
  showError: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
