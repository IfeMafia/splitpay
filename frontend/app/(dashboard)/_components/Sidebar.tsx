"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "../../lib/auth";
import { useRouter } from "next/navigation";

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Pools",
    href: "/dashboard/pools",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userName?: string;
  userEmail?: string;
}

export default function Sidebar({
  collapsed,
  onToggle,
  userName = "User",
  userEmail = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        transition: "width 220ms cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "20px 0" : "20px 16px 20px 20px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#0A0A0A" />
              <circle cx="7" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.35" />
              <circle cx="15.5" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.14" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
              Splitpay
            </span>
          </Link>
        )}

        {collapsed && (
          <Link href="/" style={{ display: "flex", textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#0A0A0A" />
              <circle cx="7" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.35" />
              <circle cx="15.5" cy="18" r="3" fill="#0A0A0A" fillOpacity="0.14" />
            </svg>
          </Link>
        )}

        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#F7F7F7",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#777",
            flexShrink: 0,
            transition: "background 120ms, color 120ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EFEFEF"; (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F7F7F7"; (e.currentTarget as HTMLElement).style.color = "#777"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? "16px 8px" : "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {!collapsed && (
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ccc", padding: "0 8px 8px" }}>
            Menu
          </span>
        )}
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 10px",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                color: active ? "#0A0A0A" : "#666",
                background: active ? "rgba(0,0,0,0.05)" : "transparent",
                textDecoration: "none",
                transition: "background 120ms, color 120ms",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Sign out */}
      <div style={{ padding: collapsed ? "12px 8px" : "14px 14px", borderTop: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
        {!collapsed ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#0A0A0A", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>
                {(userName?.[0] ?? "?").toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName}
                </div>
                <div style={{ fontSize: 10.5, color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userEmail}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", padding: "7px 8px", borderRadius: 7,
                background: "transparent", border: "none",
                fontSize: 12, color: "#999", cursor: "pointer",
                textAlign: "left", display: "flex", alignItems: "center", gap: 7,
                transition: "background 120ms, color 120ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#999"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              title={`${userName} (${userEmail})`}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#0A0A0A", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
              }}
            >
              {(userName?.[0] ?? "?").toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: "none", background: "transparent",
                color: "#aaa", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 120ms, color 120ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
