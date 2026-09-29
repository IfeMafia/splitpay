"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../../../lib/api";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatAmount, formatPercent, shortId, formatDate } from "../../../../../lib/format";
import { getUser } from "@/app/lib/auth";
import PoolNavTabs from "../../_components/PoolNavTabs";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  memberCount: number;
  currency: string;
  ownerId: string;
}

interface Collaborator {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  splitPercentage: number;
  status: string;
}

interface Payment {
  id: string;
  status: string;
  expectedAmount: number;
  actualAmount: number | null;
  currency: string;
  paidAt: string | null;
  createdAt: string;
}

interface SplitMemberShare {
  memberId: string;
  percentage: number;
}

interface SplitConfigResponse {
  id: string;
  poolId: string;
  type: "EQUAL" | "CUSTOM";
  configuration: SplitMemberShare[];
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

interface FinancialChainBreakdown {
  grossAmount: number;
  providerFee: number;
  platformFee: number;
  tax: number;
  distributableAmount: number;
  collaboratorAllocations: Array<{
    collaboratorId: string;
    userId: string | null;
    role: string;
    splitPercentage: number;
    amount: number;
  }>;
}

interface Props {
  params: Promise<{ poolId: string }>;
}

type PageState = "loading" | "ready" | "error";
type SaveState = "idle" | "submitting" | "success" | "error";

/* ─── Page ────────────────────────────────────── */

export default function SplitPage({ params }: Props) {
  const { poolId } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [pool, setPool] = useState<Pool | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [poolBalance, setPoolBalance] = useState<PoolBalanceResponse | null>(null);

  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [breakdown, setBreakdown] = useState<FinancialChainBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(100000);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  const currentUser = getUser();

  const load = useCallback(async () => {
    setPageState("loading");
    try {
      const [poolData, collabData, configData, paymentData, balanceData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<Collaborator[]>(`/collaborators/project/${poolId}`).catch(() => [] as Collaborator[]),
        api.get<SplitConfigResponse>(`/pools/${poolId}/split`).catch(() => null),
        api.get<Payment[]>(`/payments/project/${poolId}`).catch(() => [] as Payment[]),
        api.get<PoolBalanceResponse>(`/pools/${poolId}/balance`).catch(() => null),
      ]);
      setPool(poolData);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setPoolBalance(balanceData);

      const hasConfirmedPayment = Array.isArray(paymentData) && paymentData.some(p => p.status === "SUCCESSFUL" || p.status === "SUCCESS");
      setIsReadOnly(hasConfirmedPayment);

      const activeCollabs = Array.isArray(collabData)
        ? collabData.filter(c => c.status === "CONFIRMED" || c.status === "INVITED" || c.status === "ACTIVE")
        : [];
      setCollaborators(activeCollabs);

      if (configData) {
        setSplitType(configData.type);
        const shares: Record<string, number> = {};
        configData.configuration.forEach(c => {
          shares[c.memberId] = c.percentage;
        });
        setCustomShares(shares);
      } else {
        setSplitType("EQUAL");
        if (activeCollabs.length > 0) {
          const equal = Math.round((100 / activeCollabs.length) * 100) / 100;
          const shares: Record<string, number> = {};
          activeCollabs.forEach(c => { shares[c.id] = equal; });
          setCustomShares(shares);
        }
      }

      setPageState("ready");
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load split configuration.");
      setPageState("error");
    }
  }, [poolId]);

  useEffect(() => { load(); }, [load]);

  const isOwner = Boolean(pool && currentUser && currentUser.id === pool.ownerId);

  // Identify member's own collaborator record and balance
  const myCollab = collaborators.find(c =>
    (currentUser?.id && c.userId === currentUser.id) ||
    (currentUser?.email && c.invitedEmail?.toLowerCase() === currentUser.email.toLowerCase())
  );

  const myBalanceRecord = poolBalance?.memberBalances?.find(m =>
    (currentUser?.id && m.userId === currentUser.id) ||
    (myCollab && m.poolMemberId === myCollab.id)
  );

  const equalPercentage = collaborators.length > 0 ? Math.round((100 / collaborators.length) * 100) / 100 : 0;
  const mySplitPct = myCollab
    ? (splitType === "EQUAL" ? equalPercentage : (customShares[myCollab.id] ?? myCollab.splitPercentage ?? 0))
    : 0;

  // Calculate total custom sum
  const currentTotal = splitType === "EQUAL"
    ? collaborators.length * equalPercentage
    : Object.values(customShares).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const isCustomValid = Math.abs(currentTotal - 100) < 0.01;

  // Real-time breakdown calculation
  useEffect(() => {
    if (pageState !== "ready" || !pool || !isOwner) return;

    if (splitType === "CUSTOM" && !isCustomValid) {
      setBreakdown(null);
      return;
    }

    let isCancelled = false;

    async function calculate() {
      setCalculating(true);
      try {
        const collabConfig = collaborators.map(c => ({
          id: c.id,
          userId: c.userId,
          role: c.role,
          splitPercentage: splitType === "EQUAL" ? equalPercentage : (customShares[c.id] || 0)
        }));

        const data = await api.post<FinancialChainBreakdown>("/payments/calculate", {
          amount: previewAmount,
          platformFeePercent: 1.5,
          providerFee: 0,
          collaborators: collabConfig
        });

        if (!isCancelled) setBreakdown(data);
      } catch (err) {
        console.error("Calculation failed", err);
      } finally {
        if (!isCancelled) setCalculating(false);
      }
    }

    const t = setTimeout(() => calculate(), 300);
    return () => {
      isCancelled = true;
      clearTimeout(t);
    };
  }, [splitType, customShares, collaborators, pool, pageState, equalPercentage, isCustomValid, previewAmount, isOwner]);

  const handleCustomChange = (memberId: string, val: string) => {
    const num = parseFloat(val);
    setCustomShares(prev => ({
      ...prev,
      [memberId]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async () => {
    if (!isOwner) return;
    if (splitType === "CUSTOM" && !isCustomValid) return;

    setSaveState("submitting");
    setSaveError("");

    try {
      const shares = splitType === "CUSTOM"
        ? collaborators.map(c => ({ memberId: c.id, percentage: customShares[c.id] || 0 }))
        : collaborators.map(c => ({ memberId: c.id, percentage: equalPercentage }));

      await api.post(`/pools/${poolId}/split`, {
        type: splitType,
        shares
      });

      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save split configuration.");
      setSaveState("error");
    }
  };

  const confirmedPayments = payments.filter(p => p.status === "SUCCESSFUL" || p.status === "SUCCESS");

  if (pageState === "loading") return <PageSkeleton />;
  if (pageState === "error") return <PageError message={errorMsg} status={errorStatus} poolId={poolId} />;
  if (!pool) return null;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href="/dashboard/pools">Pools</BreadLink>
        <Chevron />
        <BreadLink href={`/dashboard/pools/${poolId}`}>{pool.name}</BreadLink>
        <Chevron />
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>
          {isOwner ? "Split Configuration" : "My Allocation"}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: 100,
              background: isOwner ? "rgba(0,0,0,0.06)" : "rgba(37,99,235,0.08)",
              color: isOwner ? "#0A0A0A" : "#2563EB",
            }}>
              {isOwner ? "Owner View" : "Member View"}
            </span>
            <span style={{ fontSize: 12, color: "#bbb" }}>·</span>
            <span style={{ fontSize: 12, color: "#888" }}>{pool.name}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            {isOwner ? "Split Configuration" : "My Allocation & Split"}
          </h1>
        </div>

        {!isOwner && (
          <Link
            href={`/dashboard/pools/${poolId}/withdrawals`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 100,
              background: "#0A0A0A", color: "#FFFFFF",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              transition: "background 140ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            Withdraw Funds
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <PoolNavTabs
        poolId={poolId}
        isOwner={isOwner}
      />

      {/* ─── MEMBER-SPECIFIC HERO VIEW ─── */}
      {!isOwner && (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 14 }}>
            Your Agreed Allocation
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }} className="sp-alloc-grid">
            <style>{`@media (max-width: 600px) { .sp-alloc-grid { grid-template-columns: 1fr !important; } }`}</style>

            <div>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Your Share</p>
              <p style={{ fontSize: 26, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                {formatPercent(mySplitPct)}
              </p>
              <p style={{ fontSize: 11.5, color: "#aaa", marginTop: 4 }}>of pool net distributable funds</p>
            </div>

            <div>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Total Allocated</p>
              <p style={{ fontSize: 26, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                {formatAmount(myBalanceRecord?.allocatedAmount ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11.5, color: "#aaa", marginTop: 4 }}>cumulative lifetime earnings</p>
            </div>

            <div>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Available to Withdraw</p>
              <p style={{
                fontSize: 26,
                fontWeight: 600,
                color: (myBalanceRecord?.availableBalance ?? 0) > 0 ? "#16A34A" : "#0A0A0A",
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.02em"
              }}>
                {formatAmount(myBalanceRecord?.availableBalance ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11.5, color: "#aaa", marginTop: 4 }}>ready for payout</p>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 16, flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span style={{ fontSize: 12.5, color: "#777" }}>
                Split percentages are configured and managed by the Pool Owner.
              </span>
            </div>

            <Link
              href={`/dashboard/pools/${poolId}/withdrawals`}
              style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A", textDecoration: "none" }}
            >
              View balance & payouts →
            </Link>
          </div>
        </div>
      )}

      {/* ─── OWNER STATUS BANNERS ─── */}
      {isOwner && saveState === "success" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)",
        }}>
          <CheckIcon color="#16A34A" />
          <p style={{ fontSize: 13, color: "#166534" }}>Split configuration updated successfully.</p>
        </div>
      )}

      {isOwner && saveState === "error" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
        }}>
          <AlertIcon />
          <p style={{ fontSize: 13, color: "#991B1B" }}>{saveError}</p>
        </div>
      )}

      {/* ─── TEAM SPLIT OVERVIEW ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Current Configuration Box */}
        <div style={{
          padding: 24, borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.08)", background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>
                {isOwner ? "Split Allocation Settings" : "Team Split Breakdown"}
              </h2>
              <p style={{ fontSize: 12.5, color: "#777" }}>
                {isOwner
                  ? "Define the share of proceeds each collaborator receives once payments are confirmed."
                  : "How incoming proceeds are divided among all team collaborators."}
              </p>
            </div>

            {isReadOnly && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "#166534",
                background: "rgba(22,163,74,0.08)", padding: "3px 8px", borderRadius: 100,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Payment Processed
              </span>
            )}
          </div>

          {/* Owner-only Split Type Selector */}
          {isOwner && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => !isReadOnly && setSplitType("EQUAL")}
                disabled={isReadOnly}
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 10, cursor: isReadOnly ? "default" : "pointer",
                  border: splitType === "EQUAL" ? "1px solid #0A0A0A" : "1px solid rgba(0,0,0,0.08)",
                  background: splitType === "EQUAL" ? "#0A0A0A" : "#FFFFFF",
                  color: splitType === "EQUAL" ? "#FFFFFF" : "#0A0A0A",
                  transition: "all 140ms ease",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>Equal Split</div>
                <div style={{ fontSize: 11.5, color: splitType === "EQUAL" ? "rgba(255,255,255,0.7)" : "#777" }}>
                  Divide evenly across {collaborators.length} members
                </div>
              </button>

              <button
                onClick={() => !isReadOnly && setSplitType("CUSTOM")}
                disabled={isReadOnly}
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 10, cursor: isReadOnly ? "default" : "pointer",
                  border: splitType === "CUSTOM" ? "1px solid #0A0A0A" : "1px solid rgba(0,0,0,0.08)",
                  background: splitType === "CUSTOM" ? "#0A0A0A" : "#FFFFFF",
                  color: splitType === "CUSTOM" ? "#FFFFFF" : "#0A0A0A",
                  transition: "all 140ms ease",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>Custom Split</div>
                <div style={{ fontSize: 11.5, color: splitType === "CUSTOM" ? "rgba(255,255,255,0.7)" : "#777" }}>
                  Assign custom percentages per member
                </div>
              </button>
            </div>
          )}

          {/* Collaborator List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {collaborators.map((c, i) => {
              const isMe = Boolean(
                (currentUser?.id && c.userId === currentUser.id) ||
                (currentUser?.email && c.invitedEmail?.toLowerCase() === currentUser.email.toLowerCase())
              );
              const displayEmail = c.invitedEmail || `User ${shortId(c.userId || c.id)}`;
              const sharePct = splitType === "EQUAL" ? equalPercentage : (customShares[c.id] ?? c.splitPercentage ?? 0);

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 10,
                    background: isMe ? "rgba(37,99,235,0.03)" : "#FAFAFA",
                    border: `1px solid ${isMe ? "rgba(37,99,235,0.18)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isMe ? "#2563EB" : "#0A0A0A",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}>
                      {(c.invitedEmail?.[0] || c.role?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>{displayEmail}</span>
                        {isMe && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: "#2563EB",
                            background: "rgba(37,99,235,0.08)", padding: "1px 6px", borderRadius: 100,
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.role}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isOwner && splitType === "CUSTOM" && !isReadOnly ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={isReadOnly}
                          value={customShares[c.id] === 0 ? "" : (customShares[c.id] ?? "")}
                          onChange={e => handleCustomChange(c.id, e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: 76, padding: "6px 10px", borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.14)", fontSize: 13, textAlign: "right",
                            fontFamily: "var(--font-mono)", outline: "none",
                          }}
                        />
                        <span style={{ fontSize: 13, color: "#777" }}>%</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                        {formatPercent(sharePct)}
                      </span>
                    )}

                    <StatusBadge status={c.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom total indicator for Owner */}
          {isOwner && splitType === "CUSTOM" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: isCustomValid ? "#166534" : "#991B1B",
                background: isCustomValid ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
                padding: "6px 12px",
                borderRadius: 8,
              }}>
                Total Allocation: {currentTotal.toFixed(2)}% {isCustomValid ? "✓ (Exact 100%)" : "— Must sum to 100.00%"}
              </div>
            </div>
          )}

          {/* Owner Save Button */}
          {isOwner && !isReadOnly && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={handleSave}
                disabled={saveState === "submitting" || (splitType === "CUSTOM" && !isCustomValid)}
                style={{
                  padding: "10px 22px", borderRadius: 100,
                  background: (splitType === "CUSTOM" && !isCustomValid) ? "#ccc" : "#0A0A0A",
                  color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 500,
                  cursor: (splitType === "CUSTOM" && !isCustomValid) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "background 140ms ease",
                }}
              >
                {saveState === "submitting" ? <Spinner /> : null}
                Save Split Configuration
              </button>
            </div>
          )}
        </div>

        {/* ─── SIMULATION PREVIEW (OWNER ONLY) ─── */}
        {isOwner && (
          <div style={{
            padding: 24, borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.08)", background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              Financial Breakdown Simulation
              {calculating && <Spinner />}
            </h2>
            <p style={{ fontSize: 12.5, color: "#777", marginBottom: 16 }}>
              Simulate net payout calculations based on current platform and payment fee policies.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "#555" }}>Simulated Client Payment:</span>
              <input
                type="number"
                value={previewAmount}
                onChange={e => setPreviewAmount(Number(e.target.value) || 0)}
                style={{
                  width: 140, padding: "6px 10px", borderRadius: 6,
                  border: "1px solid rgba(0,0,0,0.14)", fontSize: 13,
                  fontFamily: "var(--font-mono)", outline: "none",
                }}
              />
              <span style={{ fontSize: 13, color: "#888" }}>{pool.currency}</span>
            </div>

            {breakdown && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16, borderBottom: "1px dashed rgba(0,0,0,0.08)", marginBottom: 16 }}>
                  <SummaryRow label="Gross Client Payment" value={formatAmount(breakdown.grossAmount, pool.currency)} />
                  <SummaryRow label="Payment Provider Processing (0%)" value={`- ${formatAmount(breakdown.providerFee, pool.currency)}`} color="#888" />
                  <SummaryRow label="Platform Fee (1.01%)" value={`- ${formatAmount(breakdown.platformFee, pool.currency)}`} color="#888" />
                  <SummaryRow label="Withholding Tax (0%)" value={`- ${formatAmount(breakdown.tax, pool.currency)}`} color="#888" />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A" }}>Net Distributable Pool</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                      {formatAmount(breakdown.distributableAmount, pool.currency)}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
                  Projected Member Payouts
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {breakdown.collaboratorAllocations.map(c => {
                    const member = collaborators.find(col => col.id === c.collaboratorId);
                    const displayEmail = member?.invitedEmail || `User ${shortId(c.userId || c.collaboratorId)}`;
                    return (
                      <div key={c.collaboratorId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#444" }}>
                          {displayEmail} <span style={{ color: "#888", fontSize: 12 }}>({formatPercent(c.splitPercentage)})</span>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono)", color: "#0A0A0A" }}>
                          {formatAmount(c.amount, pool.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── HISTORICAL SNAPSHOTS AUDIT (IMMUTABLE RECORDS) ─── */}
        <div style={{
          padding: 24, borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.08)", background: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>
              Historical Split Snapshots
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: "#777", marginBottom: 18 }}>
            Immutable records of financial distributions locked at each client payment confirmation.
          </p>

          {confirmedPayments.length === 0 ? (
            <div style={{ padding: "20px 16px", borderRadius: 10, background: "#FAFAFA", textAlign: "center", color: "#888", fontSize: 13 }}>
              No finalized payments yet. When a client payment is confirmed, a locked split snapshot is generated.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {confirmedPayments.map(p => (
                <div key={p.id} style={{
                  padding: "16px 18px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>
                        Payment #{shortId(p.id)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)", color: "#0A0A0A" }}>
                      {formatAmount(p.actualAmount ?? p.expectedAmount, p.currency)}
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#888" }}>
                    Confirmed {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)} · Split frozen and credited to member ledger accounts.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────── */

function SummaryRow({ label, value, color = "#0A0A0A" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>{value}</span>
    </div>
  );
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", transition: "color 0.15s" }}
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
    <div style={{ maxWidth: 840, display: "flex", flexDirection: "column", gap: 20 }}>
      <Bone width={200} height={10} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone width={80} height={9} />
          <Bone width={180} height={18} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[1, 2].map(i => <Bone key={i} width="100%" height={230} radius="14px" />)}
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
