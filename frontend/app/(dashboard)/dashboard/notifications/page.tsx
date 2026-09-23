"use client";

import { useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            Activity
          </p>
          <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            Notifications
          </h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 28, background: "rgba(0,0,0,0.04)", borderRadius: 9, padding: 3, width: "fit-content" }}>
        {(["all", "unread"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "6px 16px", borderRadius: 7, border: "none",
              background: filter === tab ? "#fff" : "transparent",
              color: filter === tab ? "#0A0A0A" : "#888",
              fontSize: 12.5, fontWeight: filter === tab ? 500 : 400,
              cursor: "pointer", fontFamily: "var(--font-outfit)",
              boxShadow: filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 120ms",
            }}
          >
            {tab === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ paddingTop: 32 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
          No notifications yet
        </p>
        <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, maxWidth: 360, marginBottom: 28 }}>
          Activity from your Pools — like collaborator acceptances, payment confirmations, and split updates — will appear here.
        </p>
        <Link
          href="/dashboard/pools"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 13, fontWeight: 500, color: "#555",
            textDecoration: "none", transition: "color 120ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
        >
          Go to your Pools
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Backend note */}
      <div style={{
        marginTop: 48, padding: "13px 16px", borderRadius: 10,
        background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)",
      }}>
        <p style={{ fontSize: 11.5, color: "#bbb", lineHeight: 1.55 }}>
          <strong style={{ color: "#aaa" }}>Backend pending.</strong> The notifications system requires a <code style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}>/api/notifications</code> endpoint that hasn&apos;t been implemented yet. This page will display real activity once that endpoint is available.
        </p>
      </div>

    </div>
  );
}
