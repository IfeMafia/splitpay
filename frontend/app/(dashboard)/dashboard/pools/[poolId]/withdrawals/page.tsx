"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../../lib/api";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatAmount, formatDate, shortId } from "../../../../../lib/format";
import { getUser } from "@/app/lib/auth";
import PoolNavTabs from "../../_components/PoolNavTabs";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
}

interface MemberBalance {
  poolMemberId: string;
  userId: string;
  fullName: string;
  allocatedAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
}

interface PoolBalanceResponse {
  poolId: string;
  currency: string;
  totalReceived: number;
  distributableAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
  memberBalances: MemberBalance[];
}

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  bankCode: string;
  accountNumber: string;
  createdAt: string;
  member?: {
    user?: {
      fullName: string;
    }
  };
}

interface Props {
  params: Promise<{ poolId: string }>;
}

type PageState = "loading" | "ready" | "error";

type SaveState = "idle" | "submitting" | "success" | "error";

/* ─── Page ────────────────────────────────────── */

export default function WithdrawalsPage({ params }: Props) {
  const { poolId } = use(params);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [pool, setPool] = useState<Pool | null>(null);
  const [balance, setBalance] = useState<PoolBalanceResponse | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setPageState("loading");
    try {
      const [poolData, balanceData, withdrawalsData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<PoolBalanceResponse>(`/pools/${poolId}/balance`),
        api.get<Withdrawal[]>(`/pools/${poolId}/withdrawals`).catch(() => [] as Withdrawal[]),
      ]);
      setPool(poolData);
      setBalance(balanceData);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
      setPageState("ready");
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load balance and transactions.");
      setPageState("error");
    }
  }, [poolId]);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("submitting");
    setSaveError("");
    try {
      const numAmount = parseFloat(withdrawAmount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Enter a valid amount.");
      
      await api.post(`/pools/${poolId}/withdrawals`, {
        amount: numAmount,
        bankCode,
        accountNumber,
        accountName,
      });
      setSaveState("success");
      setShowModal(false);
      load(); // Refresh data
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to request withdrawal.");
      setSaveState("error");
    }
  };

  if (pageState === "loading") return <PageSkeleton />;
  if (pageState === "error") return <PageError message={errorMsg} status={errorStatus} poolId={poolId} />;
  if (!pool || !balance) return null;

  const currentUser = getUser();
  const isOwner = Boolean(pool && currentUser && currentUser.id === pool.ownerId);

  return (
    <div style={{ maxWidth: 840 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href="/dashboard/pools">Pools</BreadLink>
        <Chevron />
        <BreadLink href={`/dashboard/pools/${poolId}`}>{pool.name}</BreadLink>
        <Chevron />
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>
          {isOwner ? "Treasury & Transactions" : "My Balance & Payouts"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            {pool.name}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", lineHeight: 1.2 }}>
            {isOwner ? "Treasury & Transactions" : "My Balance & Payouts"}
          </h1>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setSaveState("idle");
            setSaveError("");
            setWithdrawAmount("");
            setBankCode("");
            setAccountNumber("");
            setAccountName("");
          }}
          disabled={balance.availableBalance <= 0}
          style={{
            padding: "10px 20px", borderRadius: 100,
            background: balance.availableBalance > 0 ? "#0A0A0A" : "#ccc",
            color: "#fff", border: "none",
            fontSize: 13, fontWeight: 500, cursor: balance.availableBalance > 0 ? "pointer" : "not-allowed",
          }}
        >
          Withdraw Funds
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <PoolNavTabs
        poolId={poolId}
        isOwner={isOwner}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard label="Total Received" amount={balance.totalReceived} currency={balance.currency} />
        <StatCard label="Total Distributable" amount={balance.distributableAmount} currency={balance.currency} />
        <StatCard label="Total Disbursed" amount={balance.withdrawnAmount} currency={balance.currency} />
        <StatCard label="Available Balance" amount={balance.availableBalance} currency={balance.currency} highlight />
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0A0A0A", marginBottom: 16 }}>Member Balances</h2>
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #eaeaea", fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <div>Member</div>
            <div style={{ textAlign: "right" }}>Allocated</div>
            <div style={{ textAlign: "right" }}>Withdrawn</div>
            <div style={{ textAlign: "right" }}>Available</div>
          </div>
          {balance.memberBalances.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#888" }}>
              No member balances found.
            </div>
          ) : (
            balance.memberBalances.map((m, i) => (
              <div key={m.poolMemberId} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "16px", borderBottom: i < balance.memberBalances.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 13, color: "#0A0A0A", alignItems: "center" }}>
                <div style={{ fontWeight: 500 }}>{m.fullName || "Unknown"}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{formatAmount(m.allocatedAmount, balance.currency)}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "#888" }}>{formatAmount(m.withdrawnAmount, balance.currency)}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{formatAmount(m.availableBalance, balance.currency)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0A0A0A", marginBottom: 16 }}>Transaction History</h2>
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" }}>
          {withdrawals.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#888" }}>
              No transactions yet.
            </div>
          ) : (
            withdrawals.map((w, i) => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: i < withdrawals.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                      {formatAmount(w.amount, w.currency)}
                    </span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {formatDate(w.createdAt)} • {w.member?.user?.fullName || "Withdrawal"} • ID: <span style={{ fontFamily: "var(--font-mono)" }}>{shortId(w.id)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#555", textAlign: "right" }}>
                  <div>Bank: {w.bankCode}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>Acct: {w.accountNumber}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowModal(false)} />
          <div style={{ position: "relative", background: "#fff", width: "100%", maxWidth: 440, borderRadius: 16, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.1)", animation: "fadeIn 0.2s ease" }}>
            <h3 style={{ fontSize: 18, fontWeight: 500, color: "#0A0A0A", marginBottom: 8 }}>Request Withdrawal</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Your available balance is {formatAmount(balance.availableBalance, balance.currency)}.</p>

            {saveError && (
              <div style={{ padding: "10px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 8, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: "#991B1B" }}>{saveError}</p>
              </div>
            )}

            <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Amount</label>
                <input type="number" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required placeholder="e.g. 5000" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Bank Code</label>
                <input type="text" value={bankCode} onChange={(e) => setBankCode(e.target.value)} required placeholder="e.g. 058 (GTB)" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required maxLength={10} placeholder="10 digits" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Account Name</label>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} required placeholder="e.g. John Doe" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 16px", borderRadius: 100, background: "transparent", color: "#666", border: "1px solid #ddd", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saveState === "submitting"} style={{ padding: "10px 16px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: saveState === "submitting" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {saveState === "submitting" ? "Requesting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, amount, currency, highlight }: { label: string, amount: number, currency: string, highlight?: boolean }) {
  return (
    <div style={{ padding: "20px", borderRadius: 12, border: highlight ? "1px solid #16A34A" : "1px solid #eaeaea", background: highlight ? "rgba(22, 163, 74, 0.04)" : "#fff" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: highlight ? "#166534" : "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 500, color: highlight ? "#15803d" : "#0A0A0A", fontFamily: "var(--font-mono)" }}>
        {formatAmount(amount, currency)}
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────── */

function PageSkeleton() {
  return (
    <div style={{ maxWidth: 840, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
      <div style={{ width: 200, height: 16, background: "#f0f0f0", borderRadius: 4, marginBottom: 40 }} />
      <div style={{ width: 300, height: 32, background: "#f0f0f0", borderRadius: 6, marginBottom: 40 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 100, background: "#f0f0f0", borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ width: "100%", height: 200, background: "#f0f0f0", borderRadius: 12 }} />
    </div>
  );
}

function PageError({ message, status, poolId }: { message: string; status: number | null; poolId: string }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href={`/dashboard/pools/${poolId}`}>Pool</BreadLink>
      </div>
      <div style={{ padding: "24px", borderRadius: 12, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: "#991B1B", marginBottom: 6 }}>
          {status === 403 ? "Access Denied" : "Error"}
        </h2>
        <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>{message}</p>
      </div>
    </div>
  );
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 12.5, color: "#888", textDecoration: "none", transition: "color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.color = "#0A0A0A"}
      onMouseLeave={e => e.currentTarget.style.color = "#888"}
    >
      {children}
    </Link>
  );
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
