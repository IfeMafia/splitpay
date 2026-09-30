"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, setUser, isAuthenticated } from "../../lib/auth";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";
import { toast } from "@/app/components/Toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface LoginResult {
  token: string;
  user: { id: string; email: string; fullName: string };
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ width: "100%", padding: 40, textAlign: "center" }}><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoFilling, setDemoFilling] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirectUrl);
    }
  }, [router, redirectUrl]);

  const DEMO_EMAIL = "Ifemafiaa@gmail.com";
  const DEMO_PASSWORD = "Winner#23";

  const handleDemoSignIn = async () => {
    setDemoFilling(true);
    // Animate fill — type each char with a small delay so the user sees it
    for (let i = 0; i <= DEMO_EMAIL.length; i++) {
      setEmail(DEMO_EMAIL.slice(0, i));
      await new Promise(r => setTimeout(r, 30));
    }
    setShowPassword(true);
    for (let i = 0; i <= DEMO_PASSWORD.length; i++) {
      setPassword(DEMO_PASSWORD.slice(0, i));
      await new Promise(r => setTimeout(r, 40));
    }
    setDemoFilling(false);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: DEMO_EMAIL.trim(), password: DEMO_PASSWORD }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
      const token = body.data?.token || body.token;
      if (!token) throw new Error("No authentication token returned");
      setToken(token);
      const userData = body.data?.user || body.user;
      if (userData) setUser(userData);
      toast.success("Signed in as Demo!");
      router.replace(redirectUrl);
    } catch (err) {
      toast.error(err, "Demo sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
      const token = body.data?.token || body.token;
      if (!token) throw new Error("No authentication token returned");
      setToken(token);
      const userData = body.data?.user || body.user;
      if (userData) {
        setUser(userData);
      }
      toast.success("Signed in successfully!");
      router.replace(redirectUrl);
    } catch (err) {
      toast.error(err, "Sign in failed. Please check your credentials and try again.");
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

      {/* Social Login */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <GoogleAuthButton
          text="continue_with"
          onSuccess={() => {
            toast.success("Signed in with Google!");
            router.replace(redirectUrl);
          }}
          onError={() => {
            // Handled via toast inside GoogleAuthButton
          }}
        />

        {/* Demo sign-in */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={loading || demoFilling}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: "100px",
            border: "1.5px dashed #D0D0D0",
            background: "#FAFAFA",
            color: "#555",
            fontSize: 13,
            fontWeight: 500,
            cursor: loading || demoFilling ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "border-color 140ms, background 140ms, color 140ms",
            fontFamily: "var(--font-outfit)",
            opacity: loading || demoFilling ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!loading && !demoFilling) {
              (e.currentTarget as HTMLElement).style.borderColor = "#0A0A0A";
              (e.currentTarget as HTMLElement).style.color = "#0A0A0A";
              (e.currentTarget as HTMLElement).style.background = "#F5F5F5";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "#D0D0D0";
            (e.currentTarget as HTMLElement).style.color = "#555";
            (e.currentTarget as HTMLElement).style.background = "#FAFAFA";
          }}
        >
          {demoFilling ? (
            <><Spinner /> Filling demo credentials…</>
          ) : loading ? (
            <><Spinner /> Signing in…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign in as Demo
            </>
          )}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
        <span style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Or email</span>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
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

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: "#666", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#666"; }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              style={{ ...inputStyle, paddingRight: "44px" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 1px #0A0A0A"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 12,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777",
                borderRadius: "6px",
                transition: "color 140ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
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
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#222"; }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
        >
          {loading ? <><Spinner /> Signing in…</> : "Sign in"}
        </button>

      </form>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        Don&apos;t have an account?{" "}
        <Link href={`/signup${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>Sign up</Link>
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

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}
