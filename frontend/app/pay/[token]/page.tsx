"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatAmount, formatDate } from "../../lib/format";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050/api";

/* ─── Types ───────────────────────────────────── */

interface PaymentLink {
  id: string;
  projectId: string;
  paymentLinkToken: string;
  expectedAmount: number | string;
  actualAmount: number | string | null;
  currency: string;
  provider: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Props {
  params: Promise<{ token: string }>;
}

type PageState = "loading" | "ready" | "paid" | "not_found" | "error" | "initializing";

/* ─── Page ────────────────────────────────────── */

export default function PayPage({ params }: Props) {
  const { token } = use(params);

  const [state, setState] = useState<PageState>("loading");
  const [payment, setPayment] = useState<PaymentLink | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Email form state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BASE_URL}/payments/link/${token}`);
        if (res.status === 404) { setState("not_found"); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? body?.message ?? `Error ${res.status}`);
        }
        const json = await res.json();
        const data: PaymentLink = json.data;
        setPayment(data);
        const isPaid = data.status === "SUCCESSFUL" || data.status === "SUCCESS";
        setState(isPaid ? "paid" : "ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load payment.");
        setState("error");
      }
    }
    load();
  }, [token]);

  function validateEmail(val: string): string {
    if (!val.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "Enter a valid email address.";
    return "";
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailTouched(true);
    setEmailError(err);
    if (err) return;

    setState("initializing");
    setErrorMsg("");

    try {
      const callbackUrl = `${window.location.origin}/pay/verify`;
      const res = await fetch(`${BASE_URL}/payments/pay/${token}/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), callbackUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? body?.message ?? `Error ${res.status}`);
      }
      const { authorizationUrl } = body.data;
      // Redirect client to Paystack-hosted checkout
      window.location.href = authorizationUrl;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to initialize payment.");
      setState("ready");
    }
  }

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
          <Bone width={100} height={9} />
          <Bone width={260} height={22} />
          <Bone width={180} height={12} />
          <div style={{ marginTop: 8 }}>
            <Bone width="100%" height={56} radius="12px" />
          </div>
          <Bone width={200} height={40} radius="100px" />
        </div>
      </Shell>
    );
  }

  /* ── Not found ── */
  if (state === "not_found") {
    return (
      <Shell>
        <div style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Link not found
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65 }}>
            This payment link doesn&apos;t exist or may have been removed. Check the URL and try again.
          </p>
        </div>
      </Shell>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <Shell>
        <div style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  /* ── Already paid ── */
  if (state === "paid" && payment) {
    return (
      <Shell>
        <div style={{ maxWidth: 440 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(22,163,74,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.25 }}>
            Payment complete
          </h1>
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 28 }}>
            This payment has already been completed. Thank you.
          </p>
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.15)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <SummaryRow label="Amount paid">
              <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500 }}>
                {formatAmount(payment.actualAmount ?? payment.expectedAmount, payment.currency)}
              </span>
            </SummaryRow>
            {payment.paidAt && <SummaryRow label="Paid on">{formatDate(payment.paidAt)}</SummaryRow>}
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Ready to pay ── */
  if (!payment) return null;

  const isInitializing = state === "initializing";
  const liveEmailError = emailTouched ? validateEmail(email) : "";

  return (
    <Shell>
      <div style={{ maxWidth: 440, width: "100%" }}>

        {/* Brand */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A", letterSpacing: "-0.01em" }}>Splitpay</span>
        </div>

        {/* Amount */}
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>
          Amount due
        </p>
        <p style={{
          fontSize: 38, fontWeight: 500, letterSpacing: "-0.04em",
          color: "#0A0A0A", lineHeight: 1, marginBottom: 6,
          fontFamily: "var(--font-geist-mono)",
        }}>
          {formatAmount(payment.expectedAmount, payment.currency)}
        </p>
        <p style={{ fontSize: 12.5, color: "#bbb", marginBottom: 32 }}>
          {payment.currency} · via Splitpay & Paystack
        </p>

        {/* Details card */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFA",
          marginBottom: 24, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <SummaryRow label="Link created">{formatDate(payment.createdAt)}</SummaryRow>
          <SummaryRow label="Provider">{payment.provider}</SummaryRow>
          <SummaryRow label="Reference">
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11.5 }}>
              {payment.paymentLinkToken.slice(0, 16)}…
            </span>
          </SummaryRow>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            padding: "11px 14px", borderRadius: 8, marginBottom: 16,
            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 12.5, color: "#991B1B" }}>{errorMsg}</p>
          </div>
        )}

        {/* Checkout form */}
        <form onSubmit={handlePay} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 7 }}>
              Your email address
            </label>
            <input
              id="pay-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailTouched) setEmailError(validateEmail(e.target.value)); }}
              onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)); }}
              placeholder="you@example.com"
              disabled={isInitializing}
              autoComplete="email"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 10,
                border: `1px solid ${liveEmailError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
                background: "#fff", fontSize: 14, color: "#0A0A0A",
                outline: "none", fontFamily: "inherit",
                transition: "border-color 140ms",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = liveEmailError ? "rgba(220,38,38,0.7)" : "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.06)"; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = liveEmailError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {liveEmailError && (
              <p style={{ fontSize: 11.5, color: "#DC2626", marginTop: 5 }}>{liveEmailError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isInitializing}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 12,
              background: isInitializing ? "rgba(0,0,0,0.06)" : "#0A0A0A",
              color: isInitializing ? "#aaa" : "#fff", border: "none",
              fontSize: 15, fontWeight: 500,
              cursor: isInitializing ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 140ms",
              marginBottom: 16,
            }}
          >
            {isInitializing ? (
              <>
                <Spinner />
                Redirecting to Paystack…
              </>
            ) : (
              `Pay ${formatAmount(payment.expectedAmount, payment.currency)}`
            )}
          </button>
        </form>

        {/* Trust line */}
        <p style={{ marginTop: 8, fontSize: 11.5, color: "#ccc", textAlign: "center" }}>
          🔒 Secured by Splitpay · Powered by Paystack
        </p>

      </div>
    </Shell>
  );
}

/* ─── Shell ───────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F9F9F9",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#0A0A0A", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Splitpay
        </Link>
        <span style={{ fontSize: 11.5, color: "#bbb" }}>Secure payment</span>
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────── */

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#bbb" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#555" }}>{children}</span>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "sp-pulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes sp-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sp-spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
