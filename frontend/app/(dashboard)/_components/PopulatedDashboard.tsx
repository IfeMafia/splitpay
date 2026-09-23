"use client";

import Link from "next/link";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatAmount, formatRelativeTime, formatPercent } from "../../lib/format";

const POOLS = [
  { id: "p1", name: "Brand Film — Pepsi Q4", status: "ACTIVE", currency: "NGN", totalAmount: 1800000, memberCount: 4, createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: "p2", name: "Website Redesign — Kuda", status: "COMPLETED", currency: "NGN", totalAmount: 3200000, memberCount: 3, createdAt: new Date(Date.now() - 86400000 * 14) },
  { id: "p3", name: "Podcast Cover Art", status: "ACTIVE", currency: "NGN", totalAmount: 420000, memberCount: 2, createdAt: new Date(Date.now() - 86400000 * 1) },
];

const ACTIVITY = [
  { id: "t1", poolName: "Brand Film — Pepsi Q4", type: "Payment received", amount: 1800000, currency: "NGN", status: "SUCCESS", at: new Date(Date.now() - 3600000 * 2) },
  { id: "t2", poolName: "Website Redesign — Kuda", type: "Withdrawal processed", amount: 960000, currency: "NGN", status: "SUCCESS", at: new Date(Date.now() - 86400000 * 2) },
  { id: "t3", poolName: "Podcast Cover Art", type: "Payment received", amount: 420000, currency: "NGN", status: "PENDING", at: new Date(Date.now() - 3600000 * 5) },
  { id: "t4", poolName: "Brand Film — Pepsi Q4", type: "Withdrawal requested", amount: 450000, currency: "NGN", status: "PROCESSING", at: new Date(Date.now() - 3600000 * 1) },
];

const ALLOCATIONS = [
  { name: "Abraham O.", percent: 40, amount: 720000, currency: "NGN", status: "ACCEPTED" },
  { name: "Samkiel T.", percent: 35, amount: 630000, currency: "NGN", status: "ACCEPTED" },
  { name: "Tobi A.", percent: 25, amount: 450000, currency: "NGN", status: "INVITED" },
];

const STATS = [
  { label: "Total Received", value: formatAmount(5420000, "NGN"), sub: "Across all Pools" },
  { label: "Pending Payouts", value: formatAmount(450000, "NGN"), sub: "1 withdrawal processing" },
  { label: "Active Pools", value: "2", sub: "of 3 Pools total" },
  { label: "Collaborators", value: "9", sub: "Across active Pools" },
];

interface Props {
  userName?: string;
}

export default function PopulatedDashboard({ userName = "Abraham" }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1100 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            Overview
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            {greeting}, {userName.split(" ")[0]}
          </h1>
        </div>
        <Link
          href="/dashboard/pools/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 100,
            background: "#0A0A0A", color: "#fff",
            fontSize: 13, fontWeight: 500, textDecoration: "none",
            whiteSpace: "nowrap", flexShrink: 0,
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

      {/* Stats strip */}
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <style>{`
          @media (max-width: 1000px) { .dash-stats { grid-template-columns: repeat(2,1fr) !important; } }
          @media (max-width: 520px)  { .dash-stats { grid-template-columns: 1fr !important; } }
        `}</style>
        {STATS.map(s => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", color: "#0A0A0A", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Active Pools */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
            Active Pools
          </p>
          <Link href="/dashboard/pools" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
            View all →
          </Link>
        </div>
        <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
          {POOLS.map((pool, i) => (
            <Link
              key={pool.id}
              href={`/dashboard/pools/${pool.id}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", gap: 12,
                borderBottom: i < POOLS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                textDecoration: "none",
                transition: "background 100ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(0,0,0,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pool.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#aaa", marginTop: 2 }}>
                    {pool.memberCount} members · {formatRelativeTime(pool.createdAt)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                  {formatAmount(pool.totalAmount, pool.currency)}
                </span>
                <StatusBadge status={pool.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity + Allocation */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        <style>{`@media (max-width: 900px) { .dash-grid-2 { grid-template-columns: 1fr !important; } }`}</style>

        {/* Activity */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>
            Recent Activity
          </p>
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {ACTIVITY.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 18px", gap: 12,
                  borderBottom: i < ACTIVITY.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", marginBottom: 2 }}>{item.type}</div>
                  <div style={{ fontSize: 11.5, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.poolName} · {formatRelativeTime(item.at)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                    {formatAmount(item.amount, item.currency)}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Allocation */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>
            Latest Split · Pepsi Q4
          </p>
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {ALLOCATIONS.map((a, i) => (
              <div
                key={a.name}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px", gap: 10,
                  borderBottom: i < ALLOCATIONS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
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
                {ALLOCATIONS.map((a, i) => {
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
          </div>
        </section>
      </div>
    </div>
  );
}
