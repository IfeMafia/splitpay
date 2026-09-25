"use client";

import { useEffect, useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: isOpen ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isOpen ? "blur(6px)" : "blur(0px)",
        transition: "background 200ms ease, backdrop-filter 200ms ease",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
          opacity: isOpen ? 1 : 0,
          transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            {title}
          </h3>
          <p style={{ fontSize: 14, color: "#666666", lineHeight: 1.55, margin: 0 }}>
            {message}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#555555",
              background: "#F5F5F7",
              border: "1px solid rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "background 140ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EAEAEA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F5F5F7")}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#FFFFFF",
              background: isDestructive ? "#DC2626" : "#0A0A0A",
              border: "none",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: isDestructive
                ? "0 4px 12px rgba(220, 38, 38, 0.25)"
                : "0 4px 12px rgba(10, 10, 10, 0.2)",
              transition: "transform 140ms, background 140ms",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget.style.transform = "translateY(-1px)");
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget.style.transform = "translateY(0)");
            }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
