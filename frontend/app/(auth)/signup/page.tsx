"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../lib/auth";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("NG");
  const [defaultCurrency, setDefaultCurrency] = useState("NGN");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
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
    setError("");

    try {
      // Step 1: register
      const regRes = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          defaultCurrency: defaultCurrency.trim().toUpperCase(),
          country: country.trim().toUpperCase(),
        }),
      });
      const regBody = await regRes.json();
      if (!regRes.ok) throw new Error(regBody?.message ?? `Error ${regRes.status}`);

      // Step 2: auto-login to get token
      const loginRes = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const loginBody = await loginRes.json();
      if (!loginRes.ok) {
        // Registration succeeded but auto-login failed — redirect to login
        router.replace("/login?registered=1");
        return;
      }
      setToken(loginBody.data.token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Full name */}
        <Field label="Full name" error={liveErrors.fullName ?? formErrors.fullName}>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            onBlur={() => touch("fullName")}
            placeholder="Jane Doe"
            disabled={loading}
            autoComplete="name"
            style={fieldInput(!!(liveErrors.fullName ?? formErrors.fullName))}
            onFocus={e => focusRing(e, !!(liveErrors.fullName ?? formErrors.fullName))}
          />
        </Field>

        {/* Email */}
        <Field label="Email address" error={liveErrors.email ?? formErrors.email}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            placeholder="name@example.com"
            disabled={loading}
            autoComplete="email"
            style={fieldInput(!!(liveErrors.email ?? formErrors.email))}
            onFocus={e => focusRing(e, !!(liveErrors.email ?? formErrors.email))}
          />
        </Field>

        {/* Password */}
        <Field label="Password" error={liveErrors.password ?? formErrors.password}>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => touch("password")}
            placeholder="At least 6 characters"
            disabled={loading}
            autoComplete="new-password"
            style={fieldInput(!!(liveErrors.password ?? formErrors.password))}
            onFocus={e => focusRing(e, !!(liveErrors.password ?? formErrors.password))}
          />
        </Field>

        {/* Country + Currency row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Country" hint="2-letter code" error={liveErrors.country ?? formErrors.country}>
            <input
              id="country"
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value.toUpperCase())}
              onBlur={() => touch("country")}
              placeholder="NG"
              maxLength={2}
              disabled={loading}
              style={{ ...fieldInput(!!(liveErrors.country ?? formErrors.country)), fontFamily: "var(--font-geist-mono)" }}
              onFocus={e => focusRing(e, !!(liveErrors.country ?? formErrors.country))}
            />
          </Field>

          <Field label="Currency" hint="3-letter code" error={liveErrors.defaultCurrency ?? formErrors.defaultCurrency}>
            <input
              id="defaultCurrency"
              type="text"
              value={defaultCurrency}
              onChange={e => setDefaultCurrency(e.target.value.toUpperCase())}
              onBlur={() => touch("defaultCurrency")}
              placeholder="NGN"
              maxLength={3}
              disabled={loading}
              style={{ ...fieldInput(!!(liveErrors.defaultCurrency ?? formErrors.defaultCurrency)), fontFamily: "var(--font-geist-mono)" }}
              onFocus={e => focusRing(e, !!(liveErrors.defaultCurrency ?? formErrors.defaultCurrency))}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "100px",
            background: loading ? "#555" : "#0A0A0A", color: "#fff", border: "none",
            fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 6, transition: "background 140ms",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "var(--font-outfit)",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#222"; }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
        >
          {loading ? <><Spinner /> Creating account…</> : "Create account"}
        </button>

      </form>

      <div style={{ marginTop: 28, fontSize: 12.5, color: "#aaa", lineHeight: 1.6 }}>
        By continuing, you agree to Splitpay&apos;s{" "}
        <Link href="/terms" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
      </div>

      <div style={{ marginTop: 24, fontSize: 14, color: "#666" }}>
        Already have an account?{" "}
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

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>{label}</label>
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
