"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

interface Props {
  onMenuOpen: () => void;
}

export default function TopBar({ onMenuOpen }: Props) {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    const cached = api.getCached<any[]>("/notifications");
    return Array.isArray(cached) ? cached.filter((n) => !n.isRead).length : 0;
  });

  const fetchUnread = useCallback(async () => {
    try {
      const data = await api.get<any[]>("/notifications");
      if (Array.isArray(data)) {
        const count = data.filter((n) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchUnread]);

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
      <style>{`
        @keyframes tb-ping-badge {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

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

      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#0A0A0A" />
          <circle cx="7" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.35" />
          <circle cx="15.5" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.14" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", fontFamily: "var(--font-sans)" }}>
          Splitpay
        </span>
      </Link>

      <Link
        href="/dashboard/notifications"
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Activity & Notifications"}
        aria-label="Activity & Notifications"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          color: "#444",
          textDecoration: "none",
          transition: "background 120ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <>
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                minWidth: 15,
                height: 15,
                borderRadius: 100,
                background: "#0A0A0A",
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                border: "1.5px solid #fff",
                fontFamily: "var(--font-mono)",
                lineHeight: 1,
                zIndex: 2,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 15,
                height: 15,
                borderRadius: "50%",
                background: "rgba(37, 99, 235, 0.4)",
                animation: "tb-ping-badge 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                zIndex: 1,
              }}
            />
          </>
        )}
      </Link>
    </header>
  );
}
