"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../../lib/api";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatAmount, formatDate, formatRelativeTime } from "../../../../../lib/format";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  totalAmount: number;
}

interface Payment {
  id: string;
  projectId: string;
  paymentLinkToken: string;
  expectedAmount: number | string;
  actualAmount: number | string | null;
  currency: string;
  provider: string;
  providerReference: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface CreateResult {
  payment: Payment;
  checkoutUrl: string;
}

interface Props {
  params: Promise<{ poolId: string }>;
}

type PageState = "loading" | "ready" | "error";
type CreateState = "idle" | "submitting" | "success" | "error";

/* ─── Page ────────────────────────────────────── */

export default function PaymentsPage({ params }: Props) {
  const { poolId } = use(params);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [pool, setPool] = useState<Pool | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [provider] = useState("paystack");
  const [createState, setCreateState] = useState<CreateState>("idle");
  const [createError, setCreateError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPageState("loading");
    try {
      const [poolData, paymentData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<Payment[]>(`/payments/project/${poolId}`).catch(() => [] as Payment[]),
      ]);
      setPool(poolData);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setPageState("ready");
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load.");
      setPageState("error");
    }
  }, [poolId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!pool) return;
    setCreateState("submitting");
    setCreateError("");
    try {
      const result = await api.post<CreateResult>("/payments/link", {
        projectId: poolId,
        expectedAmount: Number(pool.totalAmount),
        currency: pool.currency,
        provider,
      });
      setPayments(prev => [result.payment, ...prev]);
      setCreateState("success");
      setShowForm(false);
      setTimeout(() => setCreateState("idle"), 3000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create payment link.");
      setCreateState("error");
    }
  }

  async function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/pay/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: select text
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  if (pageState === "loading") return <PageSkeleton />;
  if (pageState === "error") return <PageError message={errorMsg} status={errorStatus} poolId={poolId} />;
  if (!pool) return null;

  const hasPayments = payments.length > 0;
  const confirmedPayment = payments.find(p => p.status === "SUCCESSFUL" || p.status === "SUCCESS");

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href="/dashboard/pools">Pools</BreadLink>
        <Chevron />
        <BreadLink href={`/dashboard/pools/${poolId}`}>{pool.name}</BreadLink>
        <Chevron />
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>Payment links</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            {pool.name}
          </p>
          <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            Payment links
          </h1>
        </div>
        {hasPayments && !showForm && !confirmedPayment && (
          <button
            onClick={() => setShowForm(true)}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            <PlusIcon /> New link
          </button>
        )}
      </div>

      {/* Success flash */}
      {createState === "success" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)",
        }}>
          <CheckIcon color="#16A34A" />
          <p style={{ fontSize: 13, color: "#166534" }}>Payment link created successfully. Share it with your client.</p>
        </div>
      )}

      {/* Create form — inline confirm */}
      {showForm && (
        <div style={{
          marginBottom: 24, padding: "20px 22px", borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 4 }}>Create a payment link</p>
              <p style={{ fontSize: 12.5, color: "#999", lineHeight: 1.55 }}>
                A unique payment link will be generated for this Pool. Share it with your client to collect payment.
              </p>
            </div>
            <button
              onClick={() => { setShowForm(false); setCreateState("idle"); setCreateError(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 4 }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Summary */}
          <div style={{
            padding: "12px 14px", borderRadius: 9,
            background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.07)",
            marginBottom: 16, display: "flex", flexDirection: "column", gap: 6,
          }}>
            <Row label="Pool">{pool.name}</Row>
            <Row label="Expected amount">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                {formatAmount(pool.totalAmount, pool.currency)}
              </span>
            </Row>
            <Row label="Currency">{pool.currency}</Row>
            <Row label="Payment provider">Paystack</Row>
          </div>

          {createState === "error" && createError && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 9,
              padding: "11px 14px", borderRadius: 8, marginBottom: 14,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
            }}>
              <AlertIcon />
              <p style={{ fontSize: 12.5, color: "#991B1B" }}>{createError}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCreate}
              disabled={createState === "submitting"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 22px", borderRadius: 100,
                background: createState === "submitting" ? "#555" : "#0A0A0A",
                color: "#fff", border: "none",
                fontSize: 13, fontWeight: 500,
                cursor: createState === "submitting" ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                transition: "background 140ms",
              }}
              onMouseEnter={e => { if (createState !== "submitting") (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { if (createState !== "submitting") (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              {createState === "submitting" ? <><Spinner /> Generating…</> : "Generate link"}
            </button>
            <button
              onClick={() => { setShowForm(false); setCreateState("idle"); setCreateError(""); }}
              style={{ padding: "10px 16px", borderRadius: 100, background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasPayments && !showForm && (
        <div style={{ paddingTop: 44 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <LinkIcon />
          </div>
          <p style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            No payment link yet
          </p>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24, maxWidth: 380 }}>
            Generate a unique payment link for this Pool and share it with your client. They pay without needing a Splitpay account.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={btnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            <PlusIcon /> Generate payment link
          </button>
        </div>
      )}

      {/* Payments list */}
      {hasPayments && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
              {payments.length} {payments.length === 1 ? "link" : "links"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {payments.map(p => {
              const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${p.paymentLinkToken}`;
              const isCopied = copiedId === p.id;
              const isPaid = p.status === "SUCCESSFUL" || p.status === "SUCCESS";

              return (
                <div
                  key={p.id}
                  style={{
                    padding: "18px 20px", borderRadius: 14,
                    border: isPaid ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(0,0,0,0.08)",
                    background: isPaid ? "rgba(22,163,74,0.02)" : "#fff",
                  }}
                >
                  {/* Top row: amount + status */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em", color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                        {formatAmount(p.actualAmount ?? p.expectedAmount, p.currency)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <span style={{ fontSize: 11, color: "#bbb" }}>
                      {p.paidAt ? `Paid ${formatRelativeTime(p.paidAt)}` : `Created ${formatRelativeTime(p.createdAt)}`}
                    </span>
                  </div>

                  {/* Link row */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 12px", borderRadius: 8,
                    background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)",
                    marginBottom: 12,
                  }}>
                    <span style={{
                      flex: 1, fontSize: 12, color: "#555",
                      fontFamily: "var(--font-mono)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {publicUrl}
                    </span>
                    <button
                      onClick={() => copyLink(p.paymentLinkToken, p.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 11px", borderRadius: 6,
                        background: isCopied ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.06)",
                        border: "none", cursor: "pointer",
                        fontSize: 11.5, fontWeight: 500,
                        color: isCopied ? "#166534" : "#555",
                        transition: "all 120ms", whiteSpace: "nowrap",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {isCopied ? <><CheckIcon color="#166534" size={11} /> Copied</> : <><CopyIcon /> Copy link</>}
                    </button>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <MetaItem label="Provider">{p.provider}</MetaItem>
                    <MetaItem label="Expected">{formatAmount(p.expectedAmount, p.currency)}</MetaItem>
                    {p.actualAmount != null && (
                      <MetaItem label="Received">{formatAmount(p.actualAmount, p.currency)}</MetaItem>
                    )}
                    <MetaItem label="Token">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                        {p.paymentLinkToken.slice(0, 12)}…
                      </span>
                    </MetaItem>
                    <MetaItem label="Created">{formatDate(p.createdAt)}</MetaItem>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notice: payment gateway not connected */}
          <div style={{ marginTop: 20, padding: "13px 16px", borderRadius: 10, background: "rgba(202,138,4,0.04)", border: "1px solid rgba(202,138,4,0.14)" }}>
            <p style={{ fontSize: 12, color: "#854D0E", lineHeight: 1.55 }}>
              <strong>Payment gateway pending.</strong> The link is generated and shareable, but client payment processing requires Paystack integration. Token: <span style={{ fontFamily: "var(--font-mono)" }}>{payments[0]?.paymentLinkToken.slice(0, 12)}…</span>
            </p>
          </div>
        </div>
      )}

      {/* Back link */}
      <div style={{ marginTop: 36 }}>
        <Link
          href={`/dashboard/pools/${poolId}`}
          style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Pool
        </Link>
      </div>
    </div>
  );
}

/* ─── Small helpers ───────────────────────────── */

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "9px 18px", borderRadius: 100,
  background: "#0A0A0A", color: "#fff", border: "none",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  transition: "background 140ms", whiteSpace: "nowrap", flexShrink: 0,
  fontFamily: "var(--font-sans)",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#bbb" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#555" }}>{children}</span>
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#bbb" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#555" }}>{children}</span>
    </div>
  );
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}>
      {children}
    </Link>
  );
}

function Chevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ color = "#166534", size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function PageSkeleton() {
  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
      <Bone width={200} height={10} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone width={80} height={9} />
          <Bone width={180} height={18} />
        </div>
        <Bone width={140} height={38} radius="100px" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2].map(i => <Bone key={i} width="100%" height={130} radius="14px" />)}
      </div>
    </div>
  );
}

function PageError({ message, status, poolId }: { message: string; status: number | null; poolId: string }) {
  const isAuth = status === 401 || status === 403;
  return (
    <div style={{ maxWidth: 440, paddingTop: 48 }}>
      <p style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8 }}>
        {isAuth ? "Access denied" : "Something went wrong"}
      </p>
      <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
        {isAuth ? "Your session may have expired." : message}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {isAuth
          ? <Link href="/login" style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Log in</Link>
          : <button onClick={() => window.location.reload()} style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Try again</button>
        }
        <Link href={`/dashboard/pools/${poolId}`} style={{ padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}>
          Back to Pool
        </Link>
      </div>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "skeletonPulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}
