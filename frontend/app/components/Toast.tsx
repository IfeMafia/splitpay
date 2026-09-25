"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: unknown, defaultMessage?: string) => void;
  showSuccess: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Converts technical error messages and codes into normal, user-friendly text.
 */
export function getFriendlyErrorMessage(error: unknown, defaultMessage: string = "Something went wrong. Please try again."): string {
  if (!error) return defaultMessage;

  let msg = "";
  if (typeof error === "string") {
    msg = error;
  } else if (error instanceof Error) {
    msg = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    msg = String((error as { message: unknown }).message);
  }

  if (!msg || msg === "[object Object]") {
    return defaultMessage;
  }

  const lower = msg.toLowerCase();

  // Technical Google OAuth / env errors
  if (
    lower.includes("google oauth") ||
    lower.includes("next_public_google_client_id") ||
    lower.includes("gsi") ||
    lower.includes("google_client_id")
  ) {
    return "Google sign-in is currently unavailable. Please try again or use email.";
  }

  // Network / Connection errors
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("econnrefused") ||
    lower.includes("net::err")
  ) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  // HTTP status codes & Technical ApiErrors
  if (lower.includes("http 401") || lower.includes("unauthorized") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("http 403") || lower.includes("forbidden")) {
    return "You do not have permission to perform this action.";
  }
  if (lower.includes("http 404") || lower.includes("not found")) {
    return "The requested information could not be found.";
  }
  if (lower.includes("http 409") || lower.includes("already exists") || lower.includes("conflict")) {
    return "An account or item with these details already exists.";
  }
  if (
    lower.includes("http 500") ||
    lower.includes("http 502") ||
    lower.includes("http 503") ||
    lower.includes("internal server error") ||
    lower.includes("apierror")
  ) {
    return "Server service error. Please try again in a few moments.";
  }

  // Syntax or code exception errors
  if (lower.includes("syntaxerror") || lower.includes("unexpected token") || lower.includes("json")) {
    return "An unexpected response was received. Please try again.";
  }

  // If the message is already short, non-technical, and readable, return it
  if (msg.length < 120 && !/[{}:\\\/]/.test(msg) && !msg.startsWith("Error ") && !msg.startsWith("HTTP ")) {
    return msg;
  }

  return defaultMessage;
}

let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;
let globalShowError: ((error: unknown, defaultMessage?: string) => void) | null = null;
let globalShowSuccess: ((message: string) => void) | null = null;

export const toast = {
  show: (message: string, type: ToastType = "info") => globalShowToast?.(message, type),
  error: (error: unknown, defaultMessage?: string) => globalShowError?.(error, defaultMessage),
  success: (message: string) => globalShowSuccess?.(message),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const showError = useCallback((error: unknown, defaultMessage?: string) => {
    const friendlyMsg = getFriendlyErrorMessage(error, defaultMessage);
    showToast(friendlyMsg, "error");
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, [showToast]);

  globalShowToast = showToast;
  globalShowError = showError;
  globalShowSuccess = showSuccess;

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
          width: "calc(100vw - 40px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";

  const bg = isError ? "#1F1919" : isSuccess ? "#17221A" : "#1A1D24";
  const border = isError ? "rgba(239, 68, 68, 0.4)" : isSuccess ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.15)";
  const iconColor = isError ? "#EF4444" : isSuccess ? "#22C55E" : "#3B82F6";

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "14px",
        background: bg,
        border: `1px solid ${border}`,
        color: "#FFFFFF",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(12px)",
        animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontSize: "14px",
        lineHeight: "1.4",
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        {isError && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        {isSuccess && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {!isError && !isSuccess && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
        <span style={{ fontWeight: 400 }}>{toast.message}</span>
      </div>

      <button
        onClick={onClose}
        aria-label="Close toast"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.5)",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#FFF")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
