"use client";

import Link from "next/link";

interface Props {
  onMenuOpen: () => void;
}

export default function TopBar({ onMenuOpen }: Props) {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 20px",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 4, color: "#0A0A0A", display: "flex",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#0A0A0A" />
          <circle cx="7" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.35" />
          <circle cx="15.5" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.14" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", fontFamily: "var(--font-sans)" }}>
          Splitpay
        </span>
      </Link>

      <div style={{ width: 28 }} />
    </header>
  );
}
