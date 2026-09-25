"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/app/components/Toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Password reset token is missing or invalid.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message ?? `Error ${res.status}`);
      }

      toast.success("Password reset successfully! You can now log in.");
      router.replace("/login");
    } catch (err) {
      toast.error(err, "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.4s ease" }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          Enter a new secure password for your Splitpay account.
        </p>
      </div>

      {!token ? (
        <div style={{
          padding: "16px", borderRadius: 12,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 13.5, color: "#991B1B", lineHeight: 1.5, marginBottom: 16 }}>
            Invalid or missing reset token. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500, color: "#0A0A0A", textDecoration: "underline",
            }}
          >
            Request new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* New Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="newPassword" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>New password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 1px #0A0A0A"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={eyeButtonStyle}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="confirmPassword" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>Confirm new password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: "44px" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 1px #0A0A0A"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
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
            {loading ? <><Spinner /> Resetting password…</> : "Reset password"}
          </button>
        </form>
      )}

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        Back to{" "}
        <Link href="/login" style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>Log in</Link>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
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

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute", right: 12,
  background: "transparent", border: "none", cursor: "pointer",
  padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
  color: "#777", borderRadius: "6px", transition: "color 140ms",
};

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
