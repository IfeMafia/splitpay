"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/app/lib/api";
import { setToken, setUser } from "@/app/lib/auth";
import { toast } from "@/app/components/Toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            }
          ) => void;
          prompt: (notification?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  invitationToken?: string;
  text?: "continue_with" | "signin_with" | "signup_with";
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  invitationToken,
  text = "continue_with",
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(
    clientId &&
    clientId.trim() !== "" &&
    clientId !== "your-google-client-id.apps.googleusercontent.com"
  );

  useEffect(() => {
    if (!isConfigured) {
      setConfigMissing(true);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const initGsi = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId!,
            callback: async (response) => {
              if (!response?.credential) return;
              try {
                setLoading(true);
                const res = await api.googleAuth(response.credential, invitationToken);
                if (res?.token) {
                  setToken(res.token);
                }
                if (res?.user) {
                  setUser(res.user);
                }
                onSuccess?.();
              } catch (err: unknown) {
                toast.error(err, "Google sign-in failed. Please try again.");
                onError?.("Google sign-in failed.");
              } finally {
                setLoading(false);
              }
            },
          });

          containerRef.current.innerHTML = "";

          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text,
            shape: "rectangular",
            logo_alignment: "left",
            width: "100%",
          });

          return true;
        } catch (e) {
          console.error("Error initializing Google Identity Services:", e);
        }
      }
      return false;
    };

    if (!initGsi()) {
      intervalId = setInterval(() => {
        if (initGsi()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, isConfigured, invitationToken, onSuccess, onError, text]);

  const handleFallbackClick = () => {
    if (configMissing || !isConfigured) {
      toast.error(
        "Google sign-in is currently unavailable. Please try signing in with your email and password."
      );
      onError?.("Google sign-in unavailable");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          display: isConfigured && !loading ? "flex" : "none",
          justifyContent: "center",
        }}
      />

      {(!isConfigured || loading) && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            background: "#fff",
            border: "1px solid #E5E5E5",
            fontSize: 14,
            fontWeight: 500,
            color: "#0A0A0A",
            cursor: loading ? "wait" : "pointer",
            transition: "background 140ms, border-color 140ms",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.background = "#F9F9F9";
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.background = "#fff";
          }}
        >
          {loading ? (
            <span style={{ fontSize: 13, color: "#666" }}>Signing in with Google...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      )}
    </div>
  );
}
