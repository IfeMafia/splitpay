"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/app/components/Toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message ?? `Error ${res.status}`);
      }

      setSubmitted(true);
      if (body.data?.token) {
        setResetToken(body.data.token);
      }
      toast.success("Password reset instructions generated!");
    } catch (err) {
      toast.error(err, "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.4s ease" }}>

      {/* Mobile back link */}
      <div style={{ marginBottom: 40 }} className="mobile-only">
        <Link href="/login" style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to login
        </Link>
      </div>

      {!submitted ? (
        <>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
              Forgot password?
            </h1>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              Enter the email address associated with your account and we&apos;ll help you reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
                autoComplete="email"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 1px #0A0A0A"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: "100px",
                background: loading ? "#555" : "#0A0A0A", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 8, transition: "background 140ms",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "var(--font-outfit)",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              {loading ? <><Spinner /> Sending reset link…</> : "Send reset link"}
            </button>
          </form>
        </>
      ) : (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(34, 197, 94, 0.1)", color: "#16A34A",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 400, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 28 }}>
            If an account exists for <strong style={{ color: "#0A0A0A" }}>{email}</strong>, password reset instructions have been generated.
          </p>

          {resetToken && (
            <div style={{
              padding: "16px", borderRadius: 12,
              background: "#FAFAFA", border: "1px solid #E5E5E5",
              marginBottom: 28,
            }}>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: "#444", marginBottom: 8 }}>
                Development Reset Link:
              </p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                style={{
                  fontSize: 13, color: "#2563EB", fontWeight: 500,
                  wordBreak: "break-all", textDecoration: "underline",
                }}
              >
                Click here to reset your password directly
              </Link>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "14px", borderRadius: "100px",
                background: "#0A0A0A", color: "#fff", textDecoration: "none",
                fontSize: 14, fontWeight: 500,
              }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        Remember your password?{" "}
        <Link href="/login" style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>Log in</Link>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 901px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: "12px",
  border: "1px solid #E5E5E5", background: "#fff",
  fontSize: 14, color: "#0A0A0A", outline: "none",
  transition: "border-color 140ms, box-shadow 140ms",
  fontFamily: "var(--font-outfit)",
};

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}
