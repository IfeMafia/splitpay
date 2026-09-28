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
  currency?: string;
  paidAt: string | null;
  reference?: string;
  poolName?: string;
  description?: string;
  merchantName?: string;
  payerEmail?: string;
  channel?: string;
}

interface VerifyResult {
  payment: Payment;
  breakdown: Breakdown;
}

type PageState = "loading" | "success" | "failed" | "pending" | "no_reference" | "error";

/* ─── Inner Page Content ──────────────────────── */

function VerifyContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";

  const [state, setState] = useState<PageState>(reference ? "loading" : "no_reference");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

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

  function handleCopyReference(refText: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refText);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  }

  async function handleShareReceipt(poolName: string, amount: string) {
    const shareData = {
      title: `SplitPay Receipt — ${poolName}`,
      text: `Payment Receipt for ${poolName}: ${amount}. Reference: ${reference}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Share cancelled by user
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareFeedback("Receipt link copied!");
      setTimeout(() => setShareFeedback(""), 2500);
    }
  }

  function handleDownloadHtmlReceipt(payment: Payment, amountFormatted: string, currency: string) {
    const poolName = payment.poolName || "SplitPay Workspace";
    const description = payment.description || "Automated multi-party split payment";
    const dateFormatted = payment.paidAt ? formatDate(payment.paidAt) : formatDate(new Date().toISOString());

    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${reference}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px 20px; margin: 0; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .badge { background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 100px; border: 1px solid #bbf7d0; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; }
    .amount-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
    .amount-value { font-size: 32px; font-weight: 700; font-family: monospace; color: #0f172a; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 13.5px; }
    .label { color: #64748b; }
    .value { font-weight: 500; color: #0f172a; text-align: right; }
    .mono { font-family: monospace; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">SplitPay.</div>
      <div class="badge">Verified Payment</div>
    </div>
    <div class="amount-box">
      <div class="amount-label">Amount Paid</div>
      <div class="amount-value">${amountFormatted}</div>
      <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 4px;">● Paid & Settled</div>
    </div>
    <div class="row"><span class="label">Payment For</span><span class="value">${poolName}</span></div>
    <div class="row"><span class="label">Description</span><span class="value">${description}</span></div>
    <div class="row"><span class="label">Status</span><span class="value" style="color: #16a34a; font-weight: 600;">Successful</span></div>
    <div class="row"><span class="label">Payment Channel</span><span class="value">Paystack Gateway</span></div>
    <div class="row"><span class="label">Reference</span><span class="value mono">${reference}</span></div>
    <div class="row"><span class="label">Payment Date</span><span class="value">${dateFormatted}</span></div>
    ${payment.payerEmail ? `<div class="row"><span class="label">Receipt Billed To</span><span class="value">${payment.payerEmail}</span></div>` : ''}
    <div class="footer">
      This is an official transaction receipt from SplitPay Financial Technologies.<br>
      Settlement powered by Paystack (CBN Licensed).
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SplitPay_Receipt_${reference}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── No Reference ── */
  if (state === "no_reference") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Missing Payment Reference
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 24 }}>
            No transaction reference was detected. Please make sure you completed checkout via the official payment link.
          </p>
          <Link href="/" style={primaryBtnStyle}>
            Return to Home
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#0A0A0A", margin: "0 0 4px 0" }}>
              Verifying Payment…
            </h2>
            <p style={{ fontSize: 12.5, color: "#888", margin: 0 }}>
              Confirming settlement with Paystack network.
            </p>
          </div>
          <p style={{ fontSize: 11.5, color: "#bbb", fontFamily: "var(--font-mono)" }}>
            Ref: {reference.slice(0, 20)}…
          </p>
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
            Verification Error
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={primaryBtnStyle}
          >
            Retry Verification
          </button>
        </div>
      </Shell>
    );
  }

  /* ── Failed ── */
  if (state === "failed") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(220,38,38,0.08)", color: "#DC2626",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px auto",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#0A0A0A", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Payment Failed
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 8 }}>
            Your transaction could not be authorized. No funds were debited.
          </p>
          <p style={{ fontSize: 11.5, color: "#bbb", fontFamily: "var(--font-mono)", marginBottom: 24 }}>
            Ref: {reference}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => window.history.back()} style={{ ...secondaryBtnStyle, flex: 1 }}>
              Try Again
            </button>
            <Link href="/" style={{ ...primaryBtnStyle, flex: 1, textDecoration: "none" }}>
              Home
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Success State ── */
  if (state === "success" && result) {
    const { payment, breakdown } = result;
    const currency = payment.currency || "NGN";
    const grossAmountNumber = breakdown?.grossAmount || Number(payment.actualAmount) || 0;
    const formattedAmount = formatAmount(grossAmountNumber, currency);
    const poolTitle = payment.poolName || "SplitPay Workspace";
    const poolDesc = payment.description || "Service payment";
    const dateFormatted = payment.paidAt ? formatDate(payment.paidAt) : formatDate(new Date().toISOString());

    return (
      <Shell>
        <div id="receipt-printable-card">
          
          {/* Top Pill Status & Verification */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, background: "rgba(22,163,74,0.06)", color: "#16A34A", fontSize: 11.5, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
              Payment Verified & Settled
            </div>

            <span style={{ fontSize: 11.5, color: "#888", fontWeight: 500 }}>
              Official Receipt
            </span>
          </div>

          {/* Heading with Description Context */}
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 4, lineHeight: 1.25 }}>
            {poolTitle}
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 20 }}>
            {poolDesc}
          </p>

          {/* Amount Paid Hero Box */}
          <div style={{
            padding: "18px 20px", borderRadius: 14,
            background: "#F9F9FA", border: "1px solid rgba(0,0,0,0.06)",
            marginBottom: 20, textAlign: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Amount Paid
            </span>
            <div style={{
              fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em",
              color: "#0A0A0A", fontFamily: "var(--font-mono)", marginTop: 4,
            }}>
              {formattedAmount}
            </div>
            <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 500, marginTop: 4 }}>
              ● Confirmed via Paystack Gateway
            </div>
          </div>

          {/* Receipt Breakdown Table */}
          <div style={{
            padding: "16px 18px", borderRadius: 14,
            background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)",
            display: "flex", flexDirection: "column", gap: 10,
            marginBottom: 24,
          }}>
            <Row label="Status" value="Successful" />
            <Row label="Channel" value={payment.channel || "Paystack Gateway"} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 12.5, color: "#888" }}>Reference</span>
              <button
                type="button"
                onClick={() => handleCopyReference(reference)}
                style={{ background: "none", border: "none", color: copiedRef ? "#16A34A" : "#0A0A0A", fontSize: 12.5, fontFamily: "var(--font-mono)", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {reference.slice(0, 18) + (reference.length > 18 ? "…" : "")}
                <span style={{ fontSize: 10, color: copiedRef ? "#16A34A" : "#888" }}>({copiedRef ? "Copied" : "Copy"})</span>
              </button>
            </div>
            <Row label="Date" value={dateFormatted} />
            {payment.payerEmail && <Row label="Billed To" value={payment.payerEmail} />}
          </div>

          {/* Share Feedback Toast */}
          {shareFeedback && (
            <div style={{
              background: "#0A0A0A", color: "#FFFFFF", fontSize: 12, fontWeight: 500,
              padding: "8px 14px", borderRadius: 100, textAlign: "center", marginBottom: 14,
              animation: "sp-fade-in 150ms ease",
            }}>
              ✓ {shareFeedback}
            </div>
          )}

          {/* Action Buttons: Download, Share, Print, Done */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="no-print">
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleDownloadHtmlReceipt(payment, formattedAmount, currency)}
                style={{
                  ...secondaryBtnStyle,
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>

              <button
                onClick={() => handleShareReceipt(poolTitle, formattedAmount)}
                style={{
                  ...secondaryBtnStyle,
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  ...secondaryBtnStyle,
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>

            <Link
              href="/"
              style={{ ...primaryBtnStyle, textDecoration: "none", textAlign: "center" }}
            >
              Return Home
            </Link>
          </div>

        </div>
      </Shell>
    );
  }

  return null;
}

/* ─── Page Wrapper ────────────────────────────── */

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spinner />
          <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>Loading verification…</p>
        </div>
      </Shell>
    }>
      <VerifyContent />
    </Suspense>
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
      <style>{`
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .shell-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
        @keyframes sp-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ marginBottom: 28 }} className="no-print">
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.04em", color: "#0A0A0A" }}>
            Splitpay<span style={{ color: "#2563EB" }}>.</span>
          </span>
        </Link>
      </div>

      <div className="shell-card" style={{
        width: "100%", maxWidth: 480, background: "#FFFFFF",
        borderRadius: 20, padding: "36px 32px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.06)",
      }}>
        {children}
      </div>

      <div style={{ marginTop: 24, fontSize: 11.5, color: "#aaa", textAlign: "center" }} className="no-print">
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

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sp-spin 0.7s linear infinite" }}>
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
  padding: "11px 16px",
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
