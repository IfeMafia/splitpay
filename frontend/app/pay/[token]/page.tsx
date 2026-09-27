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
  poolName?: string;
  description?: string | null;
  merchantName?: string;
}

interface Props {
  params: Promise<{ token: string }>;
}

type PageState = "loading" | "ready" | "paid" | "not_found" | "error" | "initializing";

/* ─── Page Component ─────────────────────────── */

export default function PayPage({ params }: Props) {
  const { token } = use(params);

  const [state, setState] = useState<PageState>("loading");
  const [payment, setPayment] = useState<PaymentLink | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  // Customer email form state
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
        setErrorMsg(err instanceof Error ? err.message : "Failed to load payment details.");
        setState("error");
      }
    }
    load();
  }, [token]);

  function validateEmail(val: string): string {
    if (!val.trim()) return "Email address is required to receive your receipt.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "Please enter a valid email address.";
    return "";
  }

  function handleCopyReference(refText: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refText);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
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
      window.location.href = authorizationUrl;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.");
      setState("ready");
    }
  }

  /* ── Loading Skeleton ── */
  if (state === "loading") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Bone width={110} height={10} />
          <Bone width="75%" height={24} />
          <Bone width="50%" height={14} />
          <div style={{ marginTop: 12 }}>
            <Bone width="100%" height={120} radius="14px" />
          </div>
          <Bone width="100%" height={44} radius="100px" />
        </div>
      </Shell>
    );
  }

  /* ── Not Found / Inactive ── */
  if (state === "not_found") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(0,0,0,0.04)", color: "#888",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px auto",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Payment Link Not Found
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 24 }}>
            This payment link is inactive, has expired, or was entered incorrectly.
          </p>
          <Link href="/" style={primaryBtnStyle}>
            Return to Home
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={primaryBtnStyle}
          >
            Try Again
          </button>
        </div>
      </Shell>
    );
  }

  /* ── Already Paid ── */
  if (state === "paid" && payment) {
    return (
      <Shell>
        <div>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(22,163,74,0.1)", color: "#16A34A",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 100, background: "rgba(22,163,74,0.06)", color: "#16A34A", fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />
            Payment Completed
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 6 }}>
            {payment.poolName || "Payment Confirmed"}
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 24 }}>
            This payment has already been verified and settled.
          </p>

          <div style={{
            padding: "16px", borderRadius: 14,
            background: "#F9F9FA", border: "1px solid rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", gap: 10,
            marginBottom: 24,
          }}>
            <Row label="Amount Paid" value={formatAmount(payment.actualAmount ?? payment.expectedAmount, payment.currency)} mono />
            {payment.paidAt && <Row label="Paid On" value={formatDate(payment.paidAt)} />}
            <Row label="Reference" value={payment.paymentLinkToken} mono />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => window.print()}
              style={{ ...secondaryBtnStyle, flex: 1 }}
            >
              Print Receipt
            </button>
            <Link href="/" style={{ ...primaryBtnStyle, flex: 1, textDecoration: "none" }}>
              Done
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Ready to Pay ── */
  if (!payment) return null;

  const isInitializing = state === "initializing";
  const liveEmailError = emailTouched ? validateEmail(email) : "";
  const displayAmount = formatAmount(payment.expectedAmount, payment.currency);

  return (
    <Shell>
      <div>
        
        {/* Merchant / Pool Title & Trust Badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 100, background: "rgba(22,163,74,0.06)", color: "#16A34A", fontSize: 11, fontWeight: 600 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Verified Splitpay Pool
          </div>

          <button
            type="button"
            onClick={() => handleCopyReference(payment.paymentLinkToken)}
            style={{ background: "none", border: "none", color: copiedRef ? "#16A34A" : "#888", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
          >
            {copiedRef ? "Copied Ref!" : "Ref: " + payment.paymentLinkToken.slice(0, 8) + "…"}
          </button>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 4, lineHeight: 1.25 }}>
          {payment.poolName || "Service Payment"}
        </h1>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 20 }}>
          {payment.description || `Organized by ${payment.merchantName || "Splitpay Partner"}`}
        </p>

        {/* Hero Amount & Fee Breakdown Card */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: "#F9F9FA", border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Total Due
              </span>
              <div style={{
                fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em",
                color: "#0A0A0A", fontFamily: "var(--font-mono)", marginTop: 2,
              }}>
                {displayAmount}
              </div>
            </div>
            <span style={{ fontSize: 11.5, color: "#888", paddingBottom: 4 }}>
              {payment.currency}
            </span>
          </div>

          <div style={{ borderTop: "1px dashed rgba(0,0,0,0.08)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#888" }}>Subtotal</span>
              <span style={{ color: "#444", fontFamily: "var(--font-mono)" }}>{displayAmount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#888" }}>Payment Fee</span>
              <span style={{ color: "#16A34A", fontWeight: 500 }}>₦0.00 (Covered)</span>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 12, color: "#991B1B", margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handlePay} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="pay-email" style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 6 }}>
              Your Email Address <span style={{ color: "#DC2626" }}>*</span>
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
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px", borderRadius: 10,
                border: `1px solid ${liveEmailError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
                background: isInitializing ? "#F9F9FA" : "#FFFFFF",
                fontSize: 13.5, color: "#0A0A0A",
                outline: "none", fontFamily: "inherit",
                transition: "all 140ms ease",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = liveEmailError ? "rgba(220,38,38,0.7)" : "#0A0A0A"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.06)"; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = liveEmailError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {liveEmailError ? (
              <p style={{ fontSize: 11.5, color: "#DC2626", marginTop: 4, margin: "4px 0 0 0" }}>{liveEmailError}</p>
            ) : (
              <p style={{ fontSize: 11.5, color: "#888", marginTop: 4, margin: "4px 0 0 0" }}>
                A verified transaction receipt will be sent to this email.
              </p>
            )}
          </div>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={isInitializing}
            style={{
              ...primaryBtnStyle,
              padding: "13px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isInitializing ? 0.7 : 1,
              cursor: isInitializing ? "not-allowed" : "pointer",
            }}
          >
            {isInitializing ? (
              <>
                <Spinner />
                Connecting to Paystack…
              </>
            ) : (
              `Pay ${displayAmount}`
            )}
          </button>
        </form>

        {/* Security / Trust Footer */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#888" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            256-bit Encrypted Checkout · Powered by Paystack
          </div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, color: "#aaa", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4 }}>Mastercard</span>
            <span style={{ fontSize: 10.5, color: "#aaa", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4 }}>Visa</span>
            <span style={{ fontSize: 10.5, color: "#aaa", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4 }}>Verve</span>
            <span style={{ fontSize: 10.5, color: "#aaa", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4 }}>Bank Transfer</span>
            <span style={{ fontSize: 10.5, color: "#aaa", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4 }}>USSD</span>
          </div>
        </div>

      </div>
    </Shell>
  );
}

/* ─── Consistent Shared Shell ─────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: "#FAFAFC",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.04em", color: "#0A0A0A" }}>
            Splitpay<span style={{ color: "#2563EB" }}>.</span>
          </span>
        </Link>
      </div>

      <div style={{
        width: "100%", maxWidth: 480, background: "#FFFFFF",
        borderRadius: 20, padding: "36px 32px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.06)",
      }}>
        {children}
      </div>

      {/* Subtle bottom note */}
      <div style={{ marginTop: 24, fontSize: 11.5, color: "#aaa", textAlign: "center" }}>
        Splitpay Financial Technologies · Safe, Multi-Party Revenue Clearing
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────── */

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: "#888" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: string | number; height: number; radius?: string }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, #F0F0F2 25%, #E5E5E8 50%, #F0F0F2 75%)",
      backgroundSize: "200% 100%", animation: "sp-bone-pulse 1.5s infinite",
    }}>
      <style>{`@keyframes sp-bone-pulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sp-spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 24px",
  borderRadius: 100,
  background: "#0A0A0A",
  color: "#FFFFFF",
  border: "none",
  fontSize: 13.5,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  transition: "background 140ms ease",
};

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 20px",
  borderRadius: 100,
  background: "#FFFFFF",
  color: "#0A0A0A",
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  transition: "all 140ms ease",
};
