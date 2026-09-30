"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../lib/api";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { formatAmount, formatDate, formatRelativeTime, formatPercent, shortId } from "../../../../lib/format";
import { getUser } from "@/app/lib/auth";
import PoolNavTabs from "../_components/PoolNavTabs";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  currency: string;
  status: string;
  createdAt: string;
  ownerId: string;
}

interface Collaborator {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  splitPercentage: number;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  paymentLinkToken: string;
  expectedAmount: number;
  actualAmount: number | null;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface MemberBalance {
  poolMemberId: string;
  userId: string;
  fullName: string;
  allocatedAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
}

interface PoolBalance {
  poolId: string;
  currency: string;
  totalReceived: number;
  distributableAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
  memberBalances: MemberBalance[];
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

interface Props {
  params: Promise<{ poolId: string }>;
}

type LoadState = "loading" | "ready" | "error";

/* ─── Page ────────────────────────────────────── */

export default function PoolWorkspacePage({ params }: Props) {
  const { poolId } = use(params);

  const cachedPool = api.getCached<Pool>(`/projects/${poolId}`);
  const cachedCollabs = api.getCached<Collaborator[]>(`/collaborators/project/${poolId}`);
  const cachedPayments = api.getCached<Payment[]>(`/payments/project/${poolId}`);
  const cachedBalance = api.getCached<PoolBalance>(`/pools/${poolId}/balance`);
  const cachedSplit = api.getCached<SplitConfigResponse>(`/pools/${poolId}/split`);

  const [loadState, setLoadState] = useState<LoadState>(cachedPool ? "ready" : "loading");
  const [pool, setPool] = useState<Pool | null>(cachedPool ?? null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(cachedCollabs ?? []);
  const [payments, setPayments] = useState<Payment[]>(cachedPayments ?? []);
  const [balance, setBalance] = useState<PoolBalance | null>(cachedBalance ?? null);
  const [splitConfig, setSplitConfig] = useState<SplitConfigResponse | null>(cachedSplit ?? null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    else setRefreshing(true);
    try {
      const [poolData, collabData, paymentData, balanceData, splitData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<Collaborator[]>(`/collaborators/project/${poolId}`).catch(() => [] as Collaborator[]),
        api.get<Payment[]>(`/payments/project/${poolId}`).catch(() => [] as Payment[]),
        api.get<PoolBalance>(`/pools/${poolId}/balance`).catch(() => null as PoolBalance | null),
        api.get<SplitConfigResponse>(`/pools/${poolId}/split`).catch(() => null as SplitConfigResponse | null),
      ]);
      setPool(poolData);
      const cleanCollabs = Array.isArray(collabData) ? collabData.filter(c => c.invitedEmail || c.userId) : [];
      setCollaborators(cleanCollabs);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      if (balanceData) setBalance(balanceData);
      if (splitData) setSplitConfig(splitData);
      setLoadState("ready");
    } catch (err: unknown) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load Pool.");
      if (!silent) setLoadState("error");
    } finally {
      setRefreshing(false);
    }
  }, [poolId]);

  useEffect(() => {
    load(Boolean(cachedPool));
  }, [load, cachedPool]);

  if (loadState === "loading") return <PoolSkeleton />;
  if (loadState === "error") return <PoolError message={errorMsg} status={errorStatus} poolId={poolId} />;
  if (!pool) return null;

  const hasCollaborators = collaborators.filter(c => c.role?.toUpperCase() !== "OWNER").length > 0;
  const hasPayments = payments.length > 0;
  const confirmedPayment = payments.find(p => p.status === "SUCCESS" || p.status === "SUCCESSFUL");
  const pendingPayment = payments.find(p => p.status === "PENDING" || p.status === "PROCESSING");
  const initial = pool.name.trim()[0]?.toUpperCase() ?? "P";
  const totalSplitPct = collaborators.reduce((s, c) => s + Number(c.splitPercentage), 0);
  const splitAllocated = totalSplitPct > 0;

  const currentUser = getUser();
  const isOwner = Boolean(pool && currentUser && currentUser.id === pool.ownerId);

  const myCollab = collaborators.find(
    c => (currentUser?.id && c.userId === currentUser.id) ||
         (currentUser?.id && c.id === currentUser.id) ||
         (currentUser?.email && c.invitedEmail && c.invitedEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
  );
  const myMemberBalance = balance?.memberBalances?.find(
    m => (currentUser?.id && m.userId === currentUser.id) ||
         (myCollab && m.poolMemberId === myCollab.id) ||
         (currentUser?.fullName && m.fullName && m.fullName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase())
  );

  // Compute split percentage accurately
  const mySplitPercentage: number = (() => {
    if (myCollab && Number(myCollab.splitPercentage) > 0) {
      return Number(myCollab.splitPercentage);
    }
    if (splitConfig && Array.isArray(splitConfig.configuration)) {
      const matched = splitConfig.configuration.find(
        s => (myCollab && s.memberId === myCollab.id) ||
             (myMemberBalance && s.memberId === myMemberBalance.poolMemberId) ||
             (currentUser?.id && s.memberId === currentUser.id)
      );
      if (matched && Number(matched.percentage) > 0) return Number(matched.percentage);
    }
    if (collaborators.length > 0) {
      return Math.round((100 / collaborators.length) * 100) / 100;
    }
    return 0;
  })();

  // Compute allocated earnings and available withdrawable balance
  const myAllocatedAmount: number = (() => {
    if (myMemberBalance && myMemberBalance.allocatedAmount > 0) {
      return myMemberBalance.allocatedAmount;
    }
    const poolTotal = balance?.distributableAmount || confirmedPayment?.actualAmount || confirmedPayment?.expectedAmount || 0;
    if (poolTotal > 0 && mySplitPercentage > 0) {
      return Math.round((Number(poolTotal) * (mySplitPercentage / 100)) * 100) / 100;
    }
    return 0;
  })();

  const myWithdrawnAmount: number = myMemberBalance?.withdrawnAmount ?? 0;
  const myAvailableBalance: number = myMemberBalance && myMemberBalance.availableBalance > 0
    ? myMemberBalance.availableBalance
    : Math.max(0, myAllocatedAmount - myWithdrawnAmount);

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href="/dashboard/pools">Pools</BreadLink>
        <Chevron />
        <span style={{ fontSize: 12.5, color: "#0A0A0A", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pool.name}
        </span>
      </div>

      {/* ── Pool header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 20, marginBottom: 32, paddingBottom: 28,
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: "#0A0A0A", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em",
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 5 }}>
              <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
                {pool.name}
              </h1>
              <StatusBadge status={pool.status} />
              <span style={{
                fontSize: 10.5, fontWeight: 600,
                color: isOwner ? "#0A0A0A" : "#2563EB",
                background: isOwner ? "rgba(0,0,0,0.06)" : "rgba(37,99,235,0.08)",
                padding: "2px 8px", borderRadius: 100,
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                {isOwner ? "Owner" : "Member"}
              </span>
            </div>
            {pool.description && (
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 6, maxWidth: 480 }}>
                {pool.description}
              </p>
            )}
            <p style={{ fontSize: 11.5, color: "#ccc" }}>
              Created {formatDate(pool.createdAt)}
            </p>
          </div>
        </div>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          gap: 6, flexShrink: 0,
        }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Refresh pool data"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 100,
              background: "none", color: "#aaa",
              border: "1px solid rgba(0,0,0,0.09)",
              fontSize: 11.5, cursor: refreshing ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 140ms",
              marginBottom: 4,
            }}
            onMouseEnter={e => { if (!refreshing) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={refreshing ? { animation: "sp-spin 0.7s linear infinite" } : {}}
            >
              <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#bbb" }}>
            Team Size
          </span>
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
            {pool.memberCount} {pool.memberCount === 1 ? "Member" : "Members"}
          </span>
          {confirmedPayment && (
            <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 500 }}>
              ✓ Payment confirmed
            </span>
          )}
          {pendingPayment && !confirmedPayment && (
            <span style={{ fontSize: 11, color: "#CA8A04", fontWeight: 500 }}>
              Payment pending
            </span>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <PoolNavTabs
        poolId={poolId}
        isOwner={isOwner}
        memberCount={collaborators.length}
        paymentCount={payments.length}
      />

      {/* ── Balance & Financial Summary Hero ── */}
      {isOwner ? (
        <div style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: (balance?.totalReceived ?? 0) > 0 ? "#16A34A" : "#888" }} />
              <h2 style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#666", margin: 0 }}>
                Pool Financial & Treasury Overview
              </h2>
            </div>
            <Link
              href={`/dashboard/pools/${poolId}/withdrawals`}
              style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              View Financial Ledger →
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
          }}>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                Total Received (Gross)
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(balance?.totalReceived ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Confirmed client payments</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                Distributable (Net)
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(balance?.distributableAmount ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>After processor fees</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.15)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                Available Treasury
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(balance?.availableBalance ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#15803D", marginTop: 4 }}>Ready for distribution</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                Disbursed / Withdrawn
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(balance?.withdrawnAmount ?? 0, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Paid out to collaborators</p>
            </div>
          </div>
        </div>
      ) : (
        /* Collaborator Earnings & Balance Hero */
        <div style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          padding: "22px 24px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: (myMemberBalance?.availableBalance ?? 0) > 0 ? "#16A34A" : "#2563EB" }} />
                <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#666", margin: 0 }}>
                  Your Earnings & Available Balance
                </h2>
              </div>
              <p style={{ fontSize: 12.5, color: "#888", margin: 0 }}>
                Your agreed share of confirmed pool payments
              </p>
            </div>

            <Link
              href={`/dashboard/pools/${poolId}/withdrawals`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 20px",
                borderRadius: 100,
                background: myAvailableBalance > 0 ? "#0A0A0A" : "#FAFAFA",
                color: myAvailableBalance > 0 ? "#fff" : "#777",
                border: myAvailableBalance > 0 ? "none" : "1px solid rgba(0,0,0,0.12)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 140ms ease",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {myAvailableBalance > 0 ? "Withdraw Funds" : "View Payout History"}
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
          }}>
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Available to Withdraw
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#15803D", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(myAvailableBalance, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#16A34A", marginTop: 4 }}>Ready for instant bank payout</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Your Assigned Split
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatPercent(mySplitPercentage)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Agreed pool percentage</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Total Allocated
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(myAllocatedAmount, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Gross earnings from pool</p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 10, background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Total Withdrawn
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#0A0A0A", fontFamily: "var(--font-mono)", margin: 0 }}>
                {formatAmount(myWithdrawnAmount, pool.currency)}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Transferred to your bank</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions Grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginBottom: 28,
      }}>
        {/* Collaborators Card */}
        <Link
          href={`/dashboard/pools/${poolId}/members`}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 140ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0A0A0A",
              }}>
                <PeopleIcon />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888", background: "rgba(0,0,0,0.04)", padding: "2px 7px", borderRadius: 100 }}>
                {collaborators.length} {collaborators.length === 1 ? "Member" : "Members"}
              </span>
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>
              {isOwner ? "Manage Collaborators" : "Collaborators"}
            </p>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
              {isOwner ? "Invite teammates & assign shares" : "View workspace members"}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {isOwner ? "Manage team" : "View team"} →
          </span>
        </Link>

        {/* Payment Links / Status Card */}
        <Link
          href={`/dashboard/pools/${poolId}/payments`}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 140ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: confirmedPayment ? "rgba(22,163,74,0.08)" : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: confirmedPayment ? "#16A34A" : "#0A0A0A",
              }}>
                <LinkIcon />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: confirmedPayment ? "#16A34A" : "#888",
                background: confirmedPayment ? "rgba(22,163,74,0.08)" : "rgba(0,0,0,0.04)",
                padding: "2px 7px",
                borderRadius: 100,
              }}>
                {confirmedPayment ? "Paid" : hasPayments ? "Link active" : "No link"}
              </span>
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>
              {isOwner ? "Payment Links" : "Payment Status"}
            </p>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
              {isOwner ? "Create checkout link for client" : "Track client payment status"}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {isOwner ? "View links" : "Check status"} →
          </span>
        </Link>

        {/* Splits / Allocations Card */}
        <Link
          href={`/dashboard/pools/${poolId}/split`}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 140ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0A0A0A",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                  <path d="M12 12L22 12" />
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: totalSplitPct === 100 ? "#16A34A" : "#888", background: "rgba(0,0,0,0.04)", padding: "2px 7px", borderRadius: 100 }}>
                {formatPercent(totalSplitPct)}
              </span>
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>
              {isOwner ? "Configure Split" : "My Allocation"}
            </p>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
              {isOwner ? "Set percentage rules & shares" : "View your assigned split"}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {isOwner ? "Configure split" : "View allocation"} →
          </span>
        </Link>

        {/* Balance & Withdrawals Card */}
        <Link
          href={`/dashboard/pools/${poolId}/withdrawals`}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            textDecoration: "none",
            transition: "all 140ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0A0A0A",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888", background: "rgba(0,0,0,0.04)", padding: "2px 7px", borderRadius: 100 }}>
                Payouts
              </span>
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>
              {isOwner ? "Treasury & Balance" : "My Balance & Payouts"}
            </p>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
              {isOwner ? "Financial ledger & bank payouts" : "Withdraw funds to bank"}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {isOwner ? "View ledger" : "Request payout"} →
          </span>
        </Link>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── Main column ── */}
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Next action card — Role-aware */}
          {isOwner ? (
            <>
              {!hasCollaborators && (
                <ActionCard
                  step="01"
                  title="Add collaborators"
                  description="Invite the people who'll share this payment. Each collaborator will receive a percentage of the total amount."
                  cta="Add collaborators"
                  href={`/dashboard/pools/${poolId}/members`}
                />
              )}
              {hasCollaborators && !hasPayments && (
                <ActionCard
                  step="02"
                  title="Create a payment link"
                  description="Generate a shareable link for your client. They pay directly — no Splitpay account required."
                  cta="Create payment link"
                  href={`/dashboard/pools/${poolId}/payments`}
                />
              )}
              {hasCollaborators && hasPayments && !confirmedPayment && (
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  background: "rgba(202,138,4,0.05)", border: "1px solid rgba(202,138,4,0.15)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#CA8A04", flexShrink: 0,
                    animation: "pulse 2s ease-in-out infinite",
                  }} />
                  <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
                  <p style={{ fontSize: 13, color: "#854D0E" }}>
                    Waiting for your client to complete the payment.
                  </p>
                </div>
              )}
              {confirmedPayment && !splitAllocated && (
                <ActionCard
                  step="03"
                  title="Configure the split"
                  description="Payment confirmed. Set the percentage each collaborator will receive before funds are distributed."
                  cta="Configure split"
                  href={`/dashboard/pools/${poolId}/split`}
                />
              )}
            </>
          ) : (
            <>
              {confirmedPayment ? (
                <ActionCard
                  step="01"
                  title="Payment Received — View Allocation"
                  description="Client payment confirmed. View your earnings allocation and request payout to your bank account."
                  cta="My Allocation"
                  href={`/dashboard/pools/${poolId}/split`}
                />
              ) : (
                <div style={{
                  padding: "16px 18px", borderRadius: 12,
                  background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.08)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0,
                  }} />
                  <p style={{ fontSize: 13, color: "#555" }}>
                    Workspace active. Awaiting client payment confirmation.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Collaborators */}
          <Section
            label="Collaborators"
            count={collaborators.length}
            action={isOwner
              ? { label: hasCollaborators ? "Manage" : "Add", href: `/dashboard/pools/${poolId}/members` }
              : { label: "View all", href: `/dashboard/pools/${poolId}/members` }
            }
          >
            {!hasCollaborators ? (
              <EmptyRow
                icon={<PeopleIcon />}
                text="No collaborators yet."
                sub="Add the people who'll split this payment."
              />
            ) : (
              <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
                {collaborators.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", gap: 12,
                      borderBottom: i < collaborators.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar label={c.invitedEmail?.[0] ?? "?"} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>
                          {c.invitedEmail ?? shortId(c.userId ?? "")}
                        </div>
                        <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>
                          {c.role}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "#555", fontFamily: "var(--font-mono)" }}>
                        {formatPercent(c.splitPercentage)}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
                {/* Split allocation summary */}
                {collaborators.length > 1 && (
                  <div style={{
                    padding: "10px 16px", background: "#FAFAFA",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 11, color: "#bbb" }}>Total allocated</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: totalSplitPct > 100 ? "#DC2626" : totalSplitPct === 100 ? "#16A34A" : "#888",
                    }}>
                      {formatPercent(totalSplitPct)}
                      {totalSplitPct > 100 && " — exceeds 100%"}
                      {totalSplitPct === 100 && " ✓"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Payments */}
          <Section
            label={isOwner ? "Payment Links" : "Client Payment Status"}
            count={payments.length}
            action={isOwner && hasCollaborators
              ? { label: hasPayments ? "Manage" : "Create link", href: `/dashboard/pools/${poolId}/payments` }
              : undefined
            }
          >
            {!hasPayments ? (
              <EmptyRow
                icon={<LinkIcon />}
                text={isOwner
                  ? (hasCollaborators ? "No payment link yet." : "Add collaborators first.")
                  : "Payment link not generated yet."}
                sub={isOwner
                  ? (hasCollaborators
                    ? "Create a link to share with your client."
                    : "You'll create the payment link after adding collaborators.")
                  : "The pool owner will generate a payment link for the client. Payment status will update here."}
                locked={isOwner && !hasCollaborators}
              />
            ) : (
              <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
                {payments.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", gap: 12,
                      borderBottom: i < payments.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                          {formatAmount(p.actualAmount ?? p.expectedAmount, p.currency)}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div style={{ fontSize: 11, color: "#bbb" }}>
                        {p.paidAt
                          ? `Paid ${formatRelativeTime(p.paidAt)}`
                          : `Created ${formatRelativeTime(p.createdAt)}`}
                        {" · "}
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{shortId(p.paymentLinkToken)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* ── Sidebar column ── */}
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Progress */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 16 }}>
              Progress
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Pool created", done: true, always: true },
                { label: "Collaborators added", done: hasCollaborators },
                { label: "Payment link created", done: hasPayments },
                { label: "Payment received", done: !!confirmedPayment },
                { label: "Split configured", done: splitAllocated && !!confirmedPayment },
              ].map((step, i, arr) => {
                const active = !step.done && (i === 0 || arr[i - 1].done);
                return (
                  <div key={step.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: step.done ? "#0A0A0A" : "#fff",
                        border: step.done ? "none" : active ? "2px solid #0A0A0A" : "1.5px solid rgba(0,0,0,0.15)",
                        marginTop: 1,
                      }}>
                        {step.done && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{
                          width: 1, height: 22, marginTop: 2,
                          background: step.done ? "#0A0A0A" : "rgba(0,0,0,0.08)",
                        }} />
                      )}
                    </div>
                    <p style={{
                      fontSize: 12, paddingBottom: i < arr.length - 1 ? 0 : 0,
                      fontWeight: active ? 500 : 400,
                      color: step.done ? "#0A0A0A" : active ? "#0A0A0A" : "#bbb",
                      paddingTop: 1, lineHeight: 1.4,
                      marginBottom: i < arr.length - 1 ? 6 : 0,
                    }}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pool details */}
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 14 }}>
              Pool details
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <DetailRow label="Status"><StatusBadge status={pool.status} /></DetailRow>
              <DetailRow label="Currency">
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#555" }}>{pool.currency}</span>
              </DetailRow>
              <DetailRow label="Expected">
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#555" }}>
                  {formatAmount((pool as any).totalAmount ?? 0, pool.currency)}
                </span>
              </DetailRow>
              <DetailRow label="Members">
                <span style={{ fontSize: 12, color: "#555" }}>{collaborators.length}</span>
              </DetailRow>
              <DetailRow label="Created">
                <span style={{ fontSize: 12, color: "#555" }}>{formatDate(pool.createdAt)}</span>
              </DetailRow>
              <DetailRow label="Pool ID">
                <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "#bbb" }}>{shortId(pool.id)}</span>
              </DetailRow>
            </div>
          </div>

          {/* Future entry points */}
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 2 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>
              Actions
            </p>
            {isOwner ? (
              <>
                <SideAction href={`/dashboard/pools/${poolId}/members`} label="Manage collaborators" />
                <SideAction
                  href={`/dashboard/pools/${poolId}/payments`}
                  label="Payment links"
                  disabled={!hasCollaborators}
                />
                <SideAction
                  href={`/dashboard/pools/${poolId}/split`}
                  label="Configure split"
                  disabled={!hasCollaborators}
                />
                <SideAction
                  href={`/dashboard/pools/${poolId}/withdrawals`}
                  label="Balance & Transactions"
                  disabled={!splitAllocated || !confirmedPayment}
                />
              </>
            ) : (
              <>
                <SideAction href={`/dashboard/pools/${poolId}/members`} label="View collaborators" />
                <SideAction href={`/dashboard/pools/${poolId}/payments`} label="Payment status" />
                <SideAction href={`/dashboard/pools/${poolId}/split`} label="My Allocation & Split" />
                <SideAction href={`/dashboard/pools/${poolId}/withdrawals`} label="My Balance & Payouts" />
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

/* ─── Sub-components ─────────────────────────── */

function ActionCard({ step, title, description, cta, href }: {
  step: string; title: string; description: string; cta: string; href: string;
}) {
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#bbb", fontFamily: "var(--font-mono)" }}>{step}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>{title}</span>
          </div>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, maxWidth: 380 }}>{description}</p>
        </div>
        <Link
          href={href}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 100, flexShrink: 0,
            background: "#0A0A0A", color: "#fff",
            fontSize: 12.5, fontWeight: 500, textDecoration: "none",
            transition: "background 140ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
        >
          {cta}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Section({ label, count, action, children }: {
  label: string; count?: number;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
            {label}
          </span>
          {count !== undefined && count > 0 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#888", background: "rgba(0,0,0,0.06)", borderRadius: 100, padding: "1px 7px" }}>
              {count}
            </span>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            style={{ fontSize: 12, color: "#888", textDecoration: "none", transition: "color 120ms" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
          >
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ icon, text, sub, locked }: {
  icon: React.ReactNode; text: string; sub?: string; locked?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px", borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.07)",
      background: locked ? "#FAFAFA" : "#fff",
      opacity: locked ? 0.7 : 1,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: "rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 13, color: locked ? "#bbb" : "#888" }}>{text}</p>
        {sub && <p style={{ fontSize: 11.5, color: "#ccc", marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11.5, color: "#bbb", flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: "right" }}>{children}</div>
    </div>
  );
}

function SideAction({ href, label, disabled }: { href: string; label: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <div style={{ padding: "8px 0", fontSize: 12.5, color: "#ccc", cursor: "not-allowed", userSelect: "none" }}>
        {label}
      </div>
    );
  }
  return (
    <Link
      href={href}
      style={{ display: "block", padding: "8px 0", fontSize: 12.5, color: "#555", textDecoration: "none", transition: "color 120ms" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
    >
      {label}
    </Link>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
      background: "#0A0A0A", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600,
    }}>
      {label.toUpperCase()}
    </div>
  );
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", transition: "color 120ms" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
    >
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

/* ─── Loading & Error States ─────────────────── */

function PoolSkeleton() {
  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: 24 }}>
      <Bone width={160} height={10} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 28, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <Bone width={44} height={44} radius="11px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Bone width={220} height={16} />
          <Bone width={340} height={11} />
          <Bone width={110} height={9} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Bone width={80} height={9} />
          <Bone width={140} height={22} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <Bone width="100%" height={96} radius="12px" />
          <Bone width="100%" height={64} radius="12px" />
          <Bone width="100%" height={56} radius="12px" />
        </div>
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 14 }}>
          <Bone width={80} height={9} />
          <Bone width="100%" height={140} radius="8px" />
        </div>
      </div>
    </div>
  );
}

function PoolError({ message, status, poolId }: { message: string; status: number | null; poolId: string }) {
  const isAuth = status === 401 || status === 403;
  return (
    <div style={{ maxWidth: 440, paddingTop: 56 }}>
      <div style={{ marginBottom: 18 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isAuth ? "#CA8A04" : "#DC2626"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {isAuth
            ? <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
            : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
          }
        </svg>
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
        {isAuth ? "Access denied" : "Could not load Pool"}
      </h1>
      <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
        {isAuth
          ? "You don't have permission to view this Pool, or your session has expired."
          : message}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {isAuth ? (
          <Link
            href="/login"
            style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
          >
            Log in
          </Link>
        ) : (
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        )}
        <Link href="/dashboard/pools" style={{ padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}>
          Back to Pools
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

function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
