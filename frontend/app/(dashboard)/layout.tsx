"use client";

import { useState } from "react";
import Sidebar from "./_components/Sidebar";
import TopBar from "./_components/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9F9F9" }}>
      {/* Desktop sidebar */}
      <div className="dash-sidebar">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
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
