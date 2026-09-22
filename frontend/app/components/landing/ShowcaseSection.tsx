"use client";

/* Dark navy showcase section — matches screenshot 2:
   bold white heading + floating product dashboard mockup */

export default function ShowcaseSection() {
  return (
    <section
      aria-label="Product showcase"
      style={{
        background: "var(--bg-navy)",
        padding: "clamp(72px,10vw,120px) 0 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle glow behind mockup */}
      <div aria-hidden="true" style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "80%", height: "60%",
        background: "radial-gradient(ellipse at bottom, rgba(61,153,112,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>

        {/* Heading block */}
        <div style={{ maxWidth: 640, marginBottom: 64 }}>
          <div className="label-sm" style={{ color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>
            Split Settlement
          </div>
          <h2 className="heading-xl" style={{ color: "#FFFFFF", lineHeight: 1.06 }}>
            Make payments to multiple{" "}
            <span className="serif-italic" style={{ color: "#A3C4B0" }}>collaborators</span>{" "}
            with Split Pools
          </h2>
        </div>

        {/* Product mockup — floating dashboard */}
        <div style={{ position: "relative", marginTop: 0 }}>

          {/* Outer frame / bezel */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px 20px 0 0",
            padding: "10px 10px 0",
            maxWidth: 980, margin: "0 auto",
            boxShadow: "0 -16px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          }}>

            {/* Browser chrome */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: "12px 12px 0 0",
              padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              {["#FF5F57","#FFBD2E","#28C840"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }}/>
              ))}
              <div style={{ marginLeft: 12, flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 12px", maxWidth: 280 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>app.splitpay.io/pools</span>
              </div>
            </div>

            {/* App UI */}
            <div style={{ display: "flex", height: 400, overflow: "hidden", borderRadius: "0 0 0 0" }}>

              {/* Sidebar */}
              <div style={{ width: 200, background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "20px 0", flexShrink: 0 }}>
                {/* Logo row */}
                <div style={{ padding: "0 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.1)"/><path d="M14 7v3.5M14 10.5L10.5 16h7L14 21M10 16h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Splitpay</span>
                </div>
                <SidebarGroup label="POOLS">
                  {[["Pools","active"],["Members",null],["Allocations",null],["Withdrawals",null]].map(([l,a]) => (
                    <SidebarItem key={l as string} label={l as string} active={a === "active"}/>
                  ))}
                </SidebarGroup>
                <SidebarGroup label="PAYMENTS">
                  {[["Transactions",null],["History",null],["Sub-accounts",null],["Split Rules","active2"]].map(([l]) => (
                    <SidebarItem key={l as string} label={l as string} active={false}/>
                  ))}
                </SidebarGroup>
              </div>

              {/* Main content */}
              <div style={{ flex: 1, background: "#111827", padding: "24px 28px", overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB", marginBottom: 4 }}>Split Rules</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
                  Set split rules for your pools to allocate funds automatically.
                </div>

                {/* Filter row */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1F2937", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)", flex: 1, maxWidth: 160 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>Pool type</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1F2937", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)", flex: 1, maxWidth: 160 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M7.5 7.5l2 2" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>Search</span>
                  </div>
                </div>

                {/* Table */}
                <div style={{ background: "#1F2937", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Pool name","Split code","Status"].map(h => (
                      <span key={h} style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500 }}>{h}</span>
                    ))}
                  </div>
                  {[
                    ["Highland Studio","SP-22001","Active"],
                    ["Film Collective","SP-22002","Active"],
                    ["Design Sprint","SP-22003","Draft"],
                    ["Dev Squad","SP-22004","Active"],
                  ].map(([name, code, status]) => (
                    <div key={code} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#F3F4F6" }}>{name}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#9CA3AF" }}>{code}</span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 500,
                        background: status === "Active" ? "rgba(61,153,112,0.2)" : "rgba(255,255,255,0.06)",
                        color: status === "Active" ? "#A5F2CC" : "#9CA3AF",
                      }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }}/>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel: Create a Split Rule modal */}
              <div style={{
                width: 260, background: "#fff",
                borderLeft: "1px solid rgba(0,0,0,0.08)",
                padding: "20px 18px",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#131A18" }}>Create a Split Rule</span>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="#7A8D88" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#3B4A44", marginBottom: 6 }}>Split name</div>
                  <div style={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", padding: "9px 11px", fontSize: 12, color: "#7A8D88" }}>
                    e.g. Highland Session
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#3B4A44", marginBottom: 4 }}>Split rule</div>
                  <div style={{ fontSize: 11, color: "#7A8D88", marginBottom: 10 }}>How funds are distributed among members.</div>
                  {["Percentage","Flat amount"].map(opt => (
                    <div key={opt} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${opt === "Percentage" ? "var(--green)" : "rgba(0,0,0,0.2)"}`, background: opt === "Percentage" ? "var(--green)" : "transparent", flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, color: "#131A18" }}>{opt}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#3B4A44", marginBottom: 6 }}>Select a Sub Account</div>
                  <div style={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", padding: "9px 11px", fontSize: 12, color: "#7A8D88", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Select a sub-account</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#7A8D88" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, padding: "0 10px" }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 6px", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 8, marginBottom: 2,
      background: active ? "rgba(255,255,255,0.08)" : "transparent",
      fontSize: 12, color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
      fontWeight: active ? 500 : 400,
      cursor: "default",
    }}>
      {label}
    </div>
  );
}
