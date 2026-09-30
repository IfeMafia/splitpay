"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatAmount, formatRelativeTime, formatPercent } from "../../lib/format";
import { PoolResponse, NotificationResponse, PoolBalanceResponse } from "@/lib/contracts";
import { getUser } from "@/app/lib/auth";
import { api } from "../../lib/api";

const DEMO_POOLS = [
  { id: "p1", name: "Brand Film — Pepsi Q4", status: "ACTIVE", currency: "NGN", totalAmount: 1800000, memberCount: 4, createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: "p2", name: "Website Redesign — Kuda", status: "COMPLETED", currency: "NGN", totalAmount: 3200000, memberCount: 3, createdAt: new Date(Date.now() - 86400000 * 14) },
  { id: "p3", name: "Podcast Cover Art", status: "ACTIVE", currency: "NGN", totalAmount: 420000, memberCount: 2, createdAt: new Date(Date.now() - 86400000 * 1) },
];

const DEMO_ACTIVITY = [
  { id: "t1", poolName: "Brand Film — Pepsi Q4", type: "Payment received", amount: 1800000, currency: "NGN", status: "SUCCESS", at: new Date(Date.now() - 3600000 * 2) },
  { id: "t2", poolName: "Website Redesign — Kuda", type: "Withdrawal processed", amount: 960000, currency: "NGN", status: "SUCCESS", at: new Date(Date.now() - 86400000 * 2) },
  { id: "t3", poolName: "Podcast Cover Art", type: "Payment received", amount: 420000, currency: "NGN", status: "PENDING", at: new Date(Date.now() - 3600000 * 5) },
  { id: "t4", poolName: "Brand Film — Pepsi Q4", type: "Withdrawal requested", amount: 450000, currency: "NGN", status: "PROCESSING", at: new Date(Date.now() - 3600000 * 1) },
];

const DEMO_ALLOCATIONS = [
  { name: "Abraham O.", percent: 40, amount: 720000, currency: "NGN", status: "ACCEPTED" },
  { name: "Samkiel T.", percent: 35, amount: 630000, currency: "NGN", status: "ACCEPTED" },
  { name: "Tobi A.", percent: 25, amount: 450000, currency: "NGN", status: "INVITED" },
];

interface Props {
  userName?: string;
  pools?: PoolResponse[];
  initialBalances?: Record<string, PoolBalanceResponse>;
  notifications?: NotificationResponse[];
}

export default function PopulatedDashboard({
  userName = "User",
  pools,
  initialBalances = {},
  notifications = [],
}: Props) {
  const router = useRouter();
  const isRealData = Array.isArray(pools) && pools.length > 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [poolBalances, setPoolBalances] = useState<Record<string, PoolBalanceResponse>>(initialBalances);

  useEffect(() => {
    if (initialBalances && Object.keys(initialBalances).length > 0) {
      setPoolBalances((prev) => ({ ...prev, ...initialBalances }));
    }
  }, [initialBalances]);

  useEffect(() => {
    if (!isRealData || !pools || pools.length === 0) return;
    const targetPools: PoolResponse[] = pools;
    let cancelled = false;

    async function fetchBalances() {
      try {
        const balancePromises = targetPools.map(p =>
          api.get<PoolBalanceResponse>(`/pools/${p.id}/balance`).then(b => ({ id: p.id, balance: b })).catch(() => null)
        );
        const results = await Promise.all(balancePromises);
        if (cancelled) return;
        const map: Record<string, PoolBalanceResponse> = {};
        results.forEach(r => {
          if (r && r.balance) map[r.id] = r.balance;
        });
        setPoolBalances(map);
      } catch {
        // Ignore
      }
    }

    fetchBalances();
    return () => { cancelled = true; };
  }, [isRealData, pools]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const raw = joinCode.trim();
    if (!raw) { setJoinError("Enter an invite code or link."); return; }
    setJoinError("");
    let token = raw.replace(/\/+$/, "");
    try {
      if (raw.startsWith("http")) {
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] || raw;
      }
    } catch { /* raw token */ }
    router.push(`/join/${token}`);
  }

  const currentUser = getUser();
  const currentUserId = currentUser?.id;
  const [dashboardTab, setDashboardTab] = useState<"all" | "created" | "collaborations">("all");

  // Derive pools
  const displayPools = isRealData
    ? pools.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        currency: p.currency,
        totalAmount: Number((p as any).totalAmount || 0),
        memberCount: p.memberCount ?? 1,
        createdAt: new Date(p.createdAt),
        ownerId: p.ownerId,
        userRole: p.userRole,
        isOwner: p.ownerId === currentUserId || p.userRole === "OWNER",
      }))
    : DEMO_POOLS.map(p => ({
        ...p,
        ownerId: "demo-user",
        userRole: "OWNER",
        isOwner: true,
      }));

  const createdCount = displayPools.filter(p => p.isOwner).length;
  const collabCount = displayPools.filter(p => !p.isOwner).length;

  const filteredPools = displayPools.filter(p => {
    if (dashboardTab === "created") return p.isOwner;
    if (dashboardTab === "collaborations") return !p.isOwner;
    return true;
  });

  // Derive statistics
  const totalVolume = displayPools.reduce((sum, p) => sum + p.totalAmount, 0);
  const activeCount = displayPools.filter(p => p.status === "ACTIVE").length;
  const totalMembers = displayPools.reduce((sum, p) => sum + p.memberCount, 0);
  const primaryCurrency = displayPools[0]?.currency || "NGN";

  const totalWithdrawable = isRealData
    ? displayPools.reduce((sum, p) => {
        const b = poolBalances[p.id];
        if (!b) return sum;
        if (p.isOwner) {
          return sum + (b.availableBalance || 0);
        } else {
          const mb = b.memberBalances?.find(
            m => m.userId === currentUserId || (currentUser?.fullName && m.fullName === currentUser.fullName)
          );
          return sum + (mb?.availableBalance || 0);
        }
      }, 0)
    : 450000;

  const stats = [
    {
      label: "Total Volume",
      value: formatAmount(totalVolume, primaryCurrency),
      sub: `Across ${displayPools.length} ${displayPools.length === 1 ? "Pool" : "Pools"}`,
      highlight: false,
    },
    {
      label: "Available Balance",
      value: formatAmount(totalWithdrawable, primaryCurrency),
      sub: totalWithdrawable > 0 ? "Ready to withdraw" : "₦0 withdrawable",
      highlight: totalWithdrawable > 0,
    },
    {
      label: "Active Workspaces",
      value: String(activeCount),
      sub: `${createdCount} created · ${collabCount} joined`,
      highlight: false,
    },
    {
      label: "Collaborators",
      value: String(totalMembers),
      sub: "Across all pools",
      highlight: false,
    },
  ];

  // Derive recent activity
  const activities = isRealData && notifications.length > 0
    ? notifications.slice(0, 5).map(n => ({
        id: n.id,
        poolName: n.title,
        type: n.message,
        amount: 0,
        currency: primaryCurrency,
        status: "SUCCESS",
        at: new Date(n.createdAt),
      }))
    : isRealData
    ? displayPools.slice(0, 4).map(p => ({
        id: `act-${p.id}`,
        poolName: p.name,
        type: "Pool created",
        amount: p.totalAmount,
        currency: p.currency,
        status: p.status,
        at: p.createdAt,
      }))
    : DEMO_ACTIVITY;

  const allocations = DEMO_ALLOCATIONS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1100 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            Overview
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            {greeting}, {userName.split(" ")[0]}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Join Pool */}
          <button
            onClick={() => { setShowJoin(s => !s); setJoinCode(""); setJoinError(""); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "none", color: "#555",
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit",
              transition: "background 140ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
            </svg>
            Join a Pool
          </button>
          {/* New Pool */}
          <Link
            href="/dashboard/pools/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "#0A0A0A", color: "#fff",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "background 140ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Pool
          </Link>
        </div>
      </div>

      {/* Inline join input */}
      {showJoin && (
        <div style={{
          padding: "16px 18px", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.09)", background: "#fff",
          animation: "fadeSlideIn 180ms ease",
        }}>
          <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }`}</style>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", marginBottom: 4 }}>Join a Pool</p>
          <p style={{ fontSize: 12.5, color: "#888", marginBottom: 12 }}>Paste the invite link or code your collaborator shared with you.</p>
          <form onSubmit={handleJoin} noValidate style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
              placeholder="e.g. hsy  or  splitpay.com/join/hsy"
              autoFocus
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 9,
                border: `1px solid ${joinError ? "rgba(220,38,38,0.4)" : "rgba(0,0,0,0.12)"}`,
                background: "#FAFAFA", fontSize: 13, color: "#0A0A0A",
                outline: "none", fontFamily: "var(--font-mono)",
                transition: "border-color 140ms",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.background = "#fff"; }}
              onBlur={e => { e.currentTarget.style.borderColor = joinError ? "rgba(220,38,38,0.4)" : "rgba(0,0,0,0.12)"; e.currentTarget.style.background = "#FAFAFA"; }}
              onKeyDown={e => e.key === "Enter" && handleJoin(e as unknown as React.FormEvent)}
            />
            <button type="submit" style={{
              padding: "9px 18px", borderRadius: 9,
              background: "#0A0A0A", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}>Join</button>
            <button type="button" onClick={() => { setShowJoin(false); setJoinCode(""); setJoinError(""); }} style={{
              padding: "9px 14px", borderRadius: 9,
              background: "none", border: "1px solid rgba(0,0,0,0.10)",
              color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </form>
          {joinError && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>{joinError}</p>}
        </div>
      )}

      {/* Stats strip */}
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <style>{`
          @media (max-width: 1000px) { .dash-stats { grid-template-columns: repeat(2,1fr) !important; } }
          @media (max-width: 520px)  { .dash-stats { grid-template-columns: 1fr !important; } }
        `}</style>
        {stats.map(s => (
          <div
            key={s.label}
            style={{
              background: s.highlight ? "rgba(22,163,74,0.03)" : "#fff",
              border: `1px solid ${s.highlight ? "rgba(22,163,74,0.18)" : "rgba(0,0,0,0.07)"}`,
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <p style={{
              fontSize: 10.5, fontWeight: 500, letterSpacing: "0.07em",
              textTransform: "uppercase", color: s.highlight ? "#16A34A" : "#bbb", marginBottom: 8,
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em",
              color: s.highlight ? "#15803D" : "#0A0A0A",
              fontFamily: "var(--font-mono)", lineHeight: 1,
            }}>
              {s.value}
            </p>
            <p style={{ fontSize: 11, color: s.highlight ? "#16A34A" : "#aaa", marginTop: 6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Pools List */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", margin: 0 }}>
              Workspaces
            </p>
            {/* Filter Tabs */}
            <div style={{
              display: "flex", gap: 2, background: "rgba(0,0,0,0.04)",
              borderRadius: 8, padding: 2,
            }}>
              {[
                { id: "all" as const, label: "All", count: displayPools.length },
                { id: "created" as const, label: "Created", count: createdCount },
                { id: "collaborations" as const, label: "Collaborations", count: collabCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDashboardTab(tab.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 6, border: "none",
                    background: dashboardTab === tab.id ? "#fff" : "transparent",
                    color: dashboardTab === tab.id ? "#0A0A0A" : "#777",
                    fontSize: 11.5, fontWeight: dashboardTab === tab.id ? 500 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: dashboardTab === tab.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "1px 5px", borderRadius: 100,
                    background: dashboardTab === tab.id ? "#0A0A0A" : "rgba(0,0,0,0.06)",
                    color: dashboardTab === tab.id ? "#fff" : "#888",
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Link href="/dashboard/pools" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        {filteredPools.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
              {dashboardTab === "created" ? "No pools created by you." : "No collaboration pools joined."}
            </p>
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {filteredPools.map((pool, i) => (
              <Link
                key={pool.id}
                href={`/dashboard/pools/${pool.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", gap: 12,
                  borderBottom: i < filteredPools.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  textDecoration: "none",
                  transition: "background 100ms",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: pool.isOwner ? "#0A0A0A" : "#2563EB", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {pool.name.trim()[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {pool.name}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: pool.isOwner ? "#0A0A0A" : "#2563EB",
                        background: pool.isOwner ? "rgba(0,0,0,0.06)" : "rgba(37,99,235,0.08)",
                        padding: "1px 6px", borderRadius: 100,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {pool.isOwner ? "Owner" : "Collaborator"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#aaa" }}>
                      {pool.memberCount} {pool.memberCount === 1 ? "member" : "members"} · {formatRelativeTime(pool.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  {pool.totalAmount > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                      {formatAmount(pool.totalAmount, pool.currency)}
                    </span>
                  )}
                  <StatusBadge status={pool.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Activity + Split Breakdown */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        <style>{`@media (max-width: 900px) { .dash-grid-2 { grid-template-columns: 1fr !important; } }`}</style>

        {/* Activity */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>
            Recent Activity
          </p>
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {activities.length === 0 ? (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
                No recent activity yet.
              </div>
            ) : (
              activities.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 18px", gap: 12,
                    borderBottom: i < activities.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", marginBottom: 2 }}>{item.type}</div>
                    <div style={{ fontSize: 11.5, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.poolName} · {formatRelativeTime(item.at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {item.amount > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                        {formatAmount(item.amount, item.currency)}
                      </span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Allocation */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>
            {isRealData ? "Latest Pool Overview" : "Latest Split · Pepsi Q4"}
          </p>
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {isRealData ? (
              <div style={{ padding: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", marginBottom: 6 }}>
                  {displayPools[0]?.name}
                </p>
                <p style={{ fontSize: 12, color: "#777", lineHeight: 1.5, marginBottom: 14 }}>
                  Status: <strong>{displayPools[0]?.status}</strong> · {displayPools[0]?.memberCount} members
                </p>
                <Link
                  href={`/dashboard/pools/${displayPools[0]?.id}`}
                  style={{
                    display: "inline-block", fontSize: 12.5, fontWeight: 500,
                    color: "#0A0A0A", textDecoration: "none",
                  }}
                >
                  Manage Pool & Splits →
                </Link>
              </div>
            ) : (
              <>
                {allocations.map((a, i) => (
                  <div
                    key={a.name}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", gap: 10,
                      borderBottom: i < allocations.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "#0A0A0A", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, flexShrink: 0,
                      }}>
                        {a.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{formatPercent(a.percent)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                        {formatAmount(a.amount, a.currency)}
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Split bar */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", height: 4, borderRadius: 4, overflow: "hidden", gap: 2 }}>
                    {allocations.map((a, i) => {
                      const colors = ["#0A0A0A", "#555", "#ccc"];
                      return (
                        <div
                          key={i}
                          title={`${a.name} — ${a.percent}%`}
                          style={{ flex: a.percent, background: colors[i], borderRadius: 4 }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 10.5, color: "#aaa" }}>Split breakdown</span>
                    <span style={{ fontSize: 10.5, color: "#aaa" }}>Brand Film · Pepsi Q4</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
