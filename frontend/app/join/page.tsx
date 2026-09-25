"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinInputPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = code.trim();
    if (!raw) {
      setError("Please enter a 3-character code or invitation link.");
      return;
    }

    let token = raw;
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] || raw;
      }
    } catch {
      // Treat as raw token code
    }

    setError("");
    router.push(`/join/${token}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F9F9F9",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Bar */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Splitpay
        </Link>
        <Link href="/dashboard" style={{ fontSize: 12.5, color: "#666", textDecoration: "none" }}>
          Dashboard
        </Link>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(0, 0, 0, 0.08)",
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(0,0,0,0.04)", color: "#0A0A0A",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0A0A0A", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
              Join a Pool
            </h1>
            <p style={{ fontSize: 13.5, color: "#666", margin: 0, lineHeight: 1.5 }}>
              Enter the 3-character code or paste the invite link shared with you by the pool owner.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Invite Code or Link
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. hsy or splitpay.com/join/hsy"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "14px 16px", borderRadius: 12,
                  border: `1px solid ${error ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
                  background: "#FAFAFA", fontSize: 15, color: "#0A0A0A",
                  outline: "none", fontFamily: "var(--font-mono)",
                  textAlign: "center", letterSpacing: "0.05em",
                  transition: "border-color 140ms, background 140ms",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0A0A0A";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)";
                  e.currentTarget.style.background = "#FAFAFA";
                }}
              />
              {error && (
                <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6, textAlign: "center" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 12,
                background: "#0A0A0A", color: "#FFFFFF", border: "none",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                transition: "background 140ms, transform 140ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#222")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0A0A0A")}
            >
              Continue to Pool
            </button>
          </form>

          {/* Footer note */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
              Don&apos;t have a code? Ask the pool owner to send you an invite link or code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
