"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getUser, setUser, StoredUser } from "../lib/auth";
import { api } from "../../lib/api";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setAuthed(true);

    // 1. Initial cached user from localStorage
    const cached = getUser();
    if (cached) setCurrentUser(cached);

    // 2. Fetch fresh user profile from DB
    api.getMe()
      .then((profile) => {
        if (profile) {
          const u: StoredUser = {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            defaultCurrency: profile.defaultCurrency,
            country: profile.country ?? undefined,
          };
          setCurrentUser(u);
          setUser(u);
        }
      })
      .catch(() => {
        // Silently preserve cached user if offline or network hiccup
      });
  }, [pathname, router]);

  if (!authed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#F9F9F9",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2.5px solid rgba(0,0,0,0.1)",
            borderTopColor: "#0A0A0A",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const displayName = currentUser?.fullName || "User";
  const displayEmail = currentUser?.email || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9F9F9" }}>
      {/* Desktop sidebar */}
      <div className="dash-sidebar">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          userName={displayName}
          userEmail={displayEmail}
        />
      </div>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 40,
            animation: "fadeIn 0.15s ease",
          }}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="dash-drawer"
        style={{
          position: "fixed", top: 0, left: 0, height: "100%",
          zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setDrawerOpen(false)}
          userName={displayName}
          userEmail={displayEmail}
        />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="dash-topbar">
          <TopBar onMenuOpen={() => setDrawerOpen(true)} />
        </div>
        <main style={{ flex: 1, padding: "clamp(24px, 4vw, 48px) clamp(20px, 4vw, 48px)" }}>
          {children}
        </main>
      </div>

      <style>{`
        .dash-sidebar { display: flex; }
        .dash-drawer  { display: none; }
        .dash-topbar  { display: none; }
        @media (max-width: 768px) {
          .dash-sidebar { display: none !important; }
          .dash-drawer  { display: block; }
          .dash-topbar  { display: block; }
        }
      `}</style>
    </div>
  );
}
