"use client";

/* Product Showcase — large dark panel with oversized UI */

export default function ProductShowcaseSection() {
  return (
    <section
      id="product"
      aria-label="Product showcase"
      style={{
        background: "var(--surface-dark)",
        padding: "var(--section-pad-y) var(--section-pad-x)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="text-label" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          Inside Splitpay
        </div>
        <h2 className="text-display-lg" style={{ color: "var(--text-primary)", marginBottom: 16, maxWidth: 500 }}>
          The Pool.
          <br />
          Everything in one place.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 64, maxWidth: 400 }}>
          From first payment to final withdrawal — every state is visible and recorded.
        </p>
      </div>

      {/* Oversized product UI — extends beyond container */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 clamp(20px, 6vw, 96px)",
        }}>
          <DashboardUI />
        </div>
        {/* Right fade */}
        <div aria-hidden="true" style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 120,
          background: "linear-gradient(to right, transparent, var(--surface-dark))",
          pointerEvents: "none",
        }} />
      </div>
    </section>
  );
}

function DashboardUI() {
  return (
    <div style={{
      background: "var(--surface-dark-2)",
      border: "1px solid var(--border-dark-2)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 48px 120px rgba(0,0,0,0.7)",
      minWidth: 900,
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border-dark)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
          <span className="text-mono-sm" style={{ marginLeft: 8, color: "var(--text-muted)" }}>
            Highland Studio Session · Pool Overview
          </span>
        </div>
        <span className="chip chip-success"><span className="chip-dot" />Active</span>
      </div>

      {/* Dashboard body */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 520 }}>

        {/* Sidebar */}
        <div style={{
          borderRight: "1px solid var(--border-dark)",
          padding: "20px 0",
          background: "rgba(0,0,0,0.15)",
        }}>
          {[
            { icon: "◉", label: "Overview",      active: true },
            { icon: "⊕", label: "Collaborators", active: false },
            { icon: "↗", label: "Payment links", active: false },
            { icon: "⊞", label: "Transactions",  active: false },
            { icon: "⊟", label: "Split config",  active: false },
            { icon: "↙", label: "Withdrawals",   active: false },
            { icon: "≡", label: "Audit trail",   active: false },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 20px",
              background: item.active ? "rgba(255,255,255,0.05)" : "transparent",
              borderLeft: item.active ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "default",
            }}>
              <span style={{ fontSize: 12, color: item.active ? "var(--accent)" : "var(--text-muted)" }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: item.active ? 600 : 400, color: item.active ? "var(--text-primary)" : "var(--text-muted)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total received",     value: "₦500,000",  sub: "1 transaction" },
              { label: "Distributable",      value: "₦487,500",  sub: "After fees" },
              { label: "Total allocated",    value: "₦487,500",  sub: "4 members" },
              { label: "Withdrawals",        value: "₦200,000",  sub: "1 completed" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "var(--surface-dark-3)",
                border: "1px solid var(--border-dark)",
                borderRadius: 10,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{stat.label}</div>
                <div className="text-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                  {stat.value}
                </div>
                <div className="text-mono-sm" style={{ color: "var(--text-muted)", marginTop: 3 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Allocation table */}
          <div style={{
            background: "var(--surface-dark-3)",
            border: "1px solid var(--border-dark)",
            borderRadius: 10,
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 110px 110px 100px",
              gap: 0,
              padding: "10px 16px",
              borderBottom: "1px solid var(--border-dark)",
            }}>
              {["Collaborator", "Split", "Allocated", "Available", "Status"].map(h => (
                <span key={h} className="text-mono-sm" style={{ color: "var(--text-muted)" }}>{h}</span>
              ))}
            </div>
            {[
              { role: "Producer",    initials: "PR", hue: 217, pct: "40%", allocated: "₦195,000", available: "₦0",         status: "withdrawn",  withdrawn: true },
              { role: "Vocalist",   initials: "VO", hue: 150, pct: "30%", allocated: "₦146,250", available: "₦146,250",   status: "available",  withdrawn: false },
              { role: "Songwriter", initials: "SW", hue: 280, pct: "20%", allocated: "₦97,500",  available: "₦97,500",    status: "available",  withdrawn: false },
              { role: "Mixer",      initials: "MX", hue: 45,  pct: "10%", allocated: "₦48,750",  available: "₦48,750",    status: "available",  withdrawn: false },
            ].map(row => (
              <div key={row.role} style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 110px 110px 100px",
                gap: 0,
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-dark)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `hsl(${row.hue}, 60%, 22%)`,
                    border: `1px solid hsl(${row.hue}, 60%, 34%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: `hsl(${row.hue}, 80%, 80%)`,
                    fontFamily: "var(--font-mono)",
                  }}>{row.initials}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{row.role}</span>
                </div>
                <span className="text-mono-sm" style={{ color: "var(--accent)", fontWeight: 600 }}>{row.pct}</span>
                <span className="text-mono-sm" style={{ color: "var(--text-secondary)" }}>{row.allocated}</span>
                <span className="text-mono-sm" style={{ color: row.withdrawn ? "var(--text-muted)" : "var(--text-primary)", fontWeight: row.withdrawn ? 400 : 600 }}>
                  {row.available}
                </span>
                <span className={`chip ${row.withdrawn ? "chip-success" : "chip-processing"}`} style={{ justifySelf: "start" }}>
                  <span className="chip-dot" />
                  {row.withdrawn ? "Withdrawn" : "Available"}
                </span>
              </div>
            ))}
          </div>

          {/* Transaction entry */}
          <div style={{
            background: "var(--surface-dark-3)",
            border: "1px solid var(--border-dark)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div className="text-mono-sm" style={{ color: "var(--text-muted)", marginBottom: 3 }}>
                REF: PAY_20241015_XK7M9Q2
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Client payment · via Paystack · Oct 15, 2024
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>₦500,000</div>
              <span className="chip chip-success" style={{ marginTop: 4 }}>
                <span className="chip-dot" />Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
