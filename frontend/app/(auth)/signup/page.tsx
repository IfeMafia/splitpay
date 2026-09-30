"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, setUser, isAuthenticated } from "../../lib/auth";
import GoogleAuthButton from "@/app/components/GoogleAuthButton";
import { toast } from "@/app/components/Toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface RegisterResult {
  id: string;
  email: string;
  fullName: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  country?: string;
  defaultCurrency?: string;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const invitationTokenMatch = redirectTo.match(/^\/invitations\/([^/]+)$/);
  const invitationToken = searchParams.get("invite") || searchParams.get("invitationToken") || (invitationTokenMatch ? invitationTokenMatch[1] : undefined);

  const [loading, setLoading] = useState(false);
  const [demoFilling, setDemoFilling] = useState(false);

  const DEMO_EMAIL = "Ifemafiaa@gmail.com";
  const DEMO_PASSWORD = "Winner#23";

  const handleDemoSignIn = async () => {
    setDemoFilling(true);
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
      router.replace(redirectTo);
    } catch (err) {
      toast.error(err, "Demo sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("NG");
  const [defaultCurrency, setDefaultCurrency] = useState("NGN");
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!country.trim() || country.length !== 2) errs.country = "Enter a 2-letter country code (e.g. NG).";
    if (!defaultCurrency.trim() || defaultCurrency.length !== 3) errs.defaultCurrency = "Enter a 3-letter currency code (e.g. NGN).";
    return errs;
  }

  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  const liveErrors = Object.keys(touched).length > 0 ? validate() : {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { fullName: true, email: true, password: true, country: true, defaultCurrency: true };
    setTouched(allTouched);
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);

    try {
      const payload: Record<string, string> = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        country: country.trim().toUpperCase(),
        defaultCurrency: defaultCurrency.trim().toUpperCase(),
      };
      if (invitationToken) {
        payload.invitationToken = invitationToken;
      }

      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? body?.message ?? `Error ${res.status}`);
      }

      const regData = body.data;
      if (regData?.token) {
        setToken(regData.token);
        if (regData.user) {
          setUser(regData.user);
        }
        toast.success("Account created successfully!");
        router.replace(redirectTo);
        return;
      }

      // Auto-login fallback if register returns user without token
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const loginBody = await loginRes.json();
      if (!loginRes.ok) {
        router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
        return;
      }
      setToken(loginBody.data?.token ?? loginBody.token);
      const loggedUser = loginBody.data?.user ?? loginBody.user;
      if (loggedUser) {
        setUser(loggedUser);
      }
      toast.success("Account created successfully!");
      router.replace(redirectTo);
    } catch (err) {
      toast.error(err, "Registration failed. Please check your information and try again.");
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
          Create an account
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          Join Splitpay to start managing collaborative payments and splits.
        </p>
      </div>

      {/* Social Signup */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <GoogleAuthButton
          text="signup_with"
          invitationToken={invitationToken}
          onSuccess={() => {
            toast.success("Signed in with Google!");
            router.replace(redirectTo);
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
          {demoFilling || loading ? (
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

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, marginTop: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
        <span style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Or register</span>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Full name */}
        <Field label="Full name" htmlFor="fullName" error={formErrors.fullName || liveErrors.fullName}>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            onBlur={() => touch("fullName")}
            placeholder="Jane Doe"
            required
            disabled={loading}
            autoComplete="name"
            style={fieldInput(Boolean(formErrors.fullName || liveErrors.fullName))}
            onFocus={e => focusRing(e, Boolean(formErrors.fullName || liveErrors.fullName))}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" htmlFor="email" error={formErrors.email || liveErrors.email}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            placeholder="name@example.com"
            required
            disabled={loading}
            autoComplete="email"
            style={fieldInput(Boolean(formErrors.email || liveErrors.email))}
            onFocus={e => focusRing(e, Boolean(formErrors.email || liveErrors.email))}
          />
        </Field>

        {/* Password */}
        <Field label="Password" htmlFor="password" hint="At least 8 characters" error={formErrors.password || liveErrors.password}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => touch("password")}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="new-password"
              style={{ ...fieldInput(Boolean(formErrors.password || liveErrors.password)), paddingRight: "44px" }}
              onFocus={e => focusRing(e, Boolean(formErrors.password || liveErrors.password))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute", right: 12,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#777", borderRadius: "6px", transition: "color 140ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </Field>

        {/* Country & Currency row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Country" htmlFor="country" hint="2 letters" error={formErrors.country || liveErrors.country}>
            <input
              id="country"
              type="text"
              maxLength={2}
              value={country}
              onChange={e => setCountry(e.target.value.toUpperCase())}
              onBlur={() => touch("country")}
              placeholder="NG"
              required
              disabled={loading}
              style={fieldInput(Boolean(formErrors.country || liveErrors.country))}
              onFocus={e => focusRing(e, Boolean(formErrors.country || liveErrors.country))}
            />
          </Field>
          <Field label="Currency" htmlFor="defaultCurrency" hint="3 letters" error={formErrors.defaultCurrency || liveErrors.defaultCurrency}>
            <input
              id="defaultCurrency"
              type="text"
              maxLength={3}
              value={defaultCurrency}
              onChange={e => setDefaultCurrency(e.target.value.toUpperCase())}
              onBlur={() => touch("defaultCurrency")}
              placeholder="NGN"
              required
              disabled={loading}
              style={fieldInput(Boolean(formErrors.defaultCurrency || liveErrors.defaultCurrency))}
              onFocus={e => focusRing(e, Boolean(formErrors.defaultCurrency || liveErrors.defaultCurrency))}
            />
          </Field>
        </div>

        {/* Invitation notice if token present */}
        {invitationToken && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 13, color: "#15803D" }}>Pool invitation detected — you will join automatically after sign up.</span>
          </div>
        )}

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
          {loading ? <><Spinner /> Creating account…</> : "Create account"}
        </button>

      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#777", lineHeight: 1.6 }}>
        By continuing, you agree to Splitpay&apos;s{" "}
        <Link href="/terms" style={{ color: "#0A0A0A", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" style={{ color: "#0A0A0A", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
      </div>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#666" }}>
        Already have an account?{" "}
        <Link href={`/login${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>Log in</Link>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 901px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
}

function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor?: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor={htmlFor} style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "#bbb" }}>{hint}</span>}
      </div>
      {children}
      {error && <p style={{ fontSize: 12, color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function fieldInput(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "13px 16px", borderRadius: "12px",
    border: `1px solid ${hasError ? "rgba(220,38,38,0.5)" : "#E5E5E5"}`,
    background: "#fff", fontSize: 14, color: "#0A0A0A", outline: "none",
    transition: "border-color 140ms, box-shadow 140ms",
    fontFamily: "var(--font-outfit)",
  };
}

function focusRing(e: React.FocusEvent<HTMLElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "rgba(220,38,38,0.7)" : "#0A0A0A";
  e.currentTarget.style.boxShadow = hasError ? "0 0 0 2px rgba(220,38,38,0.12)" : "0 0 0 1px #0A0A0A";
}

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
