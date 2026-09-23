"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface LoginResult {
  token: string;
  user: { id: string; email: string; fullName: string };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
      const data: LoginResult = body.data;
      setToken(data.token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.4s ease" }}>

      {/* Mobile back link */}
      <div style={{ marginBottom: 40 }} className="mobile-only">
        <Link href="/" style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </Link>
      </div>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          Log in to your Splitpay account to manage your Pools and withdrawals.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "12px 14px", borderRadius: 10, marginBottom: 20,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

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

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: "#666", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#666"; }}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            autoComplete="current-password"
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
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#222"; }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
        >
          {loading ? <><Spinner /> Signing in…</> : "Sign in"}
        </button>

      </form>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>Sign up</Link>
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
