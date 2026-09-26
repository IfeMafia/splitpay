"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatAmount, formatDate } from "../../lib/format";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050/api";

/* ─── Types ───────────────────────────────────── */

interface CollaboratorAllocation {
  collaboratorId: string;
  userId: string | null;
  role: string;
  splitPercentage: number;
  amount: number;
}

interface Breakdown {
  grossAmount: number;
  providerFee: number;
  platformFee: number;
  tax: number;
  distributableAmount: number;
  collaboratorAllocations: CollaboratorAllocation[];
}

interface Payment {
  id: string;
  status: string;
  actualAmount: string | number;
  paidAt: string | null;
}

interface VerifyResult {
  payment: Payment;
  breakdown: Breakdown;
}

type PageState = "loading" | "success" | "failed" | "pending" | "no_reference" | "error";

/* ─── Inner page (needs search params) ─────────── */

function VerifyContent() {
  const searchParams = useSearchParams();
  // Paystack returns both `reference` and `trxref` — use either
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";

  const [state, setState] = useState<PageState>(reference ? "loading" : "no_reference");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(`${BASE_URL}/payments/verify/${encodeURIComponent(reference)}`);
        if (cancelled) return;

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message ?? body?.message ?? `Error ${res.status}`);
        }

        const data: VerifyResult = body.data;
        setResult(data);

        const status = data.payment.status;
        if (status === "SUCCESSFUL" || status === "SUCCESS") setState("success");
        else if (status === "FAILED" || status === "REVERSED") setState("failed");
        else setState("pending");
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Verification failed.");
          setState("error");
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [reference]);

  /* ── No reference ── */
  if (state === "no_reference") {
    return (
      <div style={{ maxWidth: 400 }}>
        <h1 style={headingStyle}>Missing payment reference</h1>
        <p style={subStyle}>
          No payment reference was found. This can happen if you accessed this page directly rather than via the Paystack redirect.
        </p>
        <Link href="/dashboard" style={btnLinkStyle}>Go to Dashboard</Link>
      </div>
    );
  }

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", paddingTop: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </div>
          <p style={{ fontSize: 14, color: "#888" }}>Verifying your payment…</p>
          <p style={{ fontSize: 12, color: "#bbb" }}>Ref: <span style={{ fontFamily: "monospace" }}>{reference.slice(0, 24)}…</span></p>
        </div>
        <Bone width="100%" height={1} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <Bone width={120} height={10} />
            <Bone width={80} height={10} />
          </div>
        ))}
      </div>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <div style={{ maxWidth: 440 }}>
        <h1 style={headingStyle}>Verification failed</h1>
        <p style={subStyle}>{errorMsg}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => { setState("loading"); setErrorMsg(""); }}
            style={btnStyle}
          >
            Try again
          </button>
          <Link href="/dashboard" style={{ padding: "10px 18px", borderRadius: 100, fontSize: 13, color: "#888", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Failed ── */
  if (state === "failed") {
    return (
      <div style={{ maxWidth: 440 }}>
        <div style={iconWrap("rgba(220,38,38,0.08)")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 style={headingStyle}>Payment failed</h1>
        <p style={subStyle}>
          Your payment could not be processed. No funds have been charged. Please try again with a different card or payment method.
        </p>
        <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 24, fontFamily: "monospace" }}>Ref: {reference}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => window.history.back()} style={btnStyle}>Try again</button>
          <Link href="/dashboard" style={{ padding: "10px 18px", borderRadius: 100, fontSize: 13, color: "#888", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Pending ── */
  if (state === "pending") {
    return (
      <div style={{ maxWidth: 440 }}>
        <div style={iconWrap("rgba(202,138,4,0.08)")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={headingStyle}>Payment pending</h1>
        <p style={subStyle}>
          Your payment is being processed. This usually takes a few seconds. If the status doesn't update, check back in a moment.
        </p>
        <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 24, fontFamily: "monospace" }}>Ref: {reference}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setState("loading"); }} style={btnStyle}>Check again</button>
          <Link href="/dashboard" style={{ padding: "10px 18px", borderRadius: 100, fontSize: 13, color: "#888", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (state === "success" && result) {
    const { payment, breakdown } = result;
    const currency = "NGN"; // breakdown amounts are in NGN (major units)

    return (
      <div style={{ maxWidth: 480, width: "100%" }}>
        {/* Icon */}
        <div style={iconWrap("rgba(22,163,74,0.1)")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ ...headingStyle, marginBottom: 6 }}>Payment successful!</h1>
        <p style={{ ...subStyle, marginBottom: 28 }}>
          Your payment has been confirmed and funds have been allocated.
          {payment.paidAt && ` Paid on ${formatDate(payment.paidAt)}.`}
        </p>

        {/* Financial breakdown */}
        <div style={{
          border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14,
          background: "#fff", overflow: "hidden", marginBottom: 20,
        }}>
          {/* Header */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#FAFAFA" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
              Financial breakdown
            </p>
          </div>

          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <BreakdownRow label="Gross amount" value={formatAmount(breakdown.grossAmount, currency)} />
            <BreakdownRow label="Provider fee (Paystack)" value={`− ${formatAmount(breakdown.providerFee, currency)}`} dimValue />
            {breakdown.platformFee > 0 && (
              <BreakdownRow label="Platform fee" value={`− ${formatAmount(breakdown.platformFee, currency)}`} dimValue />
            )}
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
              <BreakdownRow
                label="Distributable amount"
                value={formatAmount(breakdown.distributableAmount, currency)}
                bold
              />
            </div>
          </div>

          {/* Allocations */}
          {breakdown.collaboratorAllocations.length > 0 && (
            <>
              <div style={{ padding: "10px 18px 4px", borderTop: "1px solid rgba(0,0,0,0.05)", background: "#FAFAFA" }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
                  Collaborator allocations
                </p>
              </div>
              <div style={{ padding: "10px 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {breakdown.collaboratorAllocations.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, color: "#0A0A0A", fontWeight: 500 }}>{a.role}</span>
                      <span style={{ fontSize: 11, color: "#bbb", marginLeft: 6 }}>{a.splitPercentage}%</span>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 500, color: "#16A34A", flexShrink: 0 }}>
                      {formatAmount(a.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reference */}
        <p style={{ fontSize: 11.5, color: "#bbb", marginBottom: 24, fontFamily: "monospace" }}>
          Ref: {reference}
        </p>

        <Link href="/dashboard" style={btnLinkStyle}>Go to Dashboard</Link>
      </div>
    );
  }

  return null;
}

/* ─── Page wrapper (Suspense for useSearchParams) ── */

export default function VerifyPage() {
  return (
    <Shell>
      <Suspense fallback={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Spinner />
          <p style={{ fontSize: 13, color: "#888" }}>Loading…</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </Shell>
  );
}

/* ─── Shell ───────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9F9F9", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#0A0A0A", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Splitpay
        </Link>
        <span style={{ fontSize: 11.5, color: "#bbb" }}>Payment verification</span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────── */

const headingStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em",
  color: "#0A0A0A", marginBottom: 8, lineHeight: 1.25,
};

const subStyle: React.CSSProperties = {
  fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 24,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 22px", borderRadius: 100,
  background: "#0A0A0A", color: "#fff", border: "none",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
};

const btnLinkStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "11px 24px", borderRadius: 100,
  background: "#0A0A0A", color: "#fff",
  fontSize: 13, fontWeight: 500, textDecoration: "none",
};

function iconWrap(bg: string): React.CSSProperties {
  return {
    width: 52, height: 52, borderRadius: "50%", background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  };
}

function BreakdownRow({ label, value, dimValue, bold }: { label: string; value: string; dimValue?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: bold ? "#0A0A0A" : "#888", fontWeight: bold ? 500 : 400 }}>{label}</span>
      <span style={{
        fontSize: 13, fontFamily: "monospace",
        color: dimValue ? "#bbb" : bold ? "#0A0A0A" : "#555",
        fontWeight: bold ? 600 : 400,
      }}>{value}</span>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "vp-pulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes vp-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "vp-spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes vp-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
