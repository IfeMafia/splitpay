"use client";

import Link from "next/link";

export default function EmptyDashboard() {
  return (
    <div style={{
      minHeight: "calc(100vh - 120px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 520, width: "100%" }}>

        {/* Wordmark / context */}
        <p style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#bbb", marginBottom: 28,
        }}>
          Splitpay
        </p>

        {/* Hero heading */}
        <h1 style={{
          fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
          color: "#0A0A0A", lineHeight: 1.25, marginBottom: 14,
        }}>
          Collect and split payments<br />with your team
        </h1>

        <p style={{
          fontSize: 14.5, color: "#888", lineHeight: 1.7,
          marginBottom: 36, maxWidth: 420,
        }}>
          Create a Pool, invite your collaborators, and share a payment link with your client. Splitpay distributes the money automatically — no spreadsheets, no chasing.
        </p>

        {/* Primary CTA */}
        <Link
          href="/dashboard/pools/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 26px", borderRadius: 100,
            background: "#0A0A0A", color: "#fff",
            fontSize: 14, fontWeight: 500, textDecoration: "none",
            transition: "background 140ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create a Pool
        </Link>

        {/* 3 key facts */}
        <div style={{
          marginTop: 52,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
        }}>
          <style>{`
            @media (max-width: 560px) {
              .sp-facts { grid-template-columns: 1fr !important; }
            }
          `}</style>
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: "Team-ready",
              body: "Invite collaborators to a Pool and assign each person a split percentage.",
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ),
              title: "One link",
              body: "Share a payment link with your client. They pay once — no Splitpay account needed.",
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              title: "Auto-split",
              body: "Once paid, Splitpay divides the funds and each collaborator requests their payout.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="sp-facts" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#555",
              }}>
                {icon}
              </div>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A" }}>{title}</p>
              <p style={{ fontSize: 12.5, color: "#999", lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
