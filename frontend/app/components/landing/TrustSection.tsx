"use client";

/* Trust section — technical, ledger-style, no marketing fluff */

const EVENTS = [
  { time: "14:23:01", event: "Payment initialized",       ref: "TXN_XK7M9Q2", actor: "system",  type: "info" },
  { time: "14:23:18", event: "Paystack callback received", ref: "PAY_20241015_XK7M9Q2", actor: "paystack", type: "info" },
  { time: "14:23:18", event: "Payment verified",           ref: "PAY_20241015_XK7M9Q2", actor: "system",  type: "success" },
  { time: "14:23:19", event: "Ledger entry created",       ref: "LDG_00921",              actor: "system",  type: "success" },
  { time: "14:23:19", event: "Split snapshot captured",    ref: "SNP_2024_0089_001",      actor: "system",  type: "success" },
  { time: "14:24:02", event: "Allocations calculated",     ref: "ALLOC_4_MEMBERS",        actor: "system",  type: "success" },
  { time: "14:24:02", event: "Member balances updated",    ref: "4 entries",              actor: "system",  type: "success" },
  { time: "15:41:30", event: "Withdrawal requested",       ref: "WDR_PR_0089",            actor: "producer", type: "info" },
  { time: "15:41:31", event: "Funds reserved",             ref: "₦195,000 locked",        actor: "system",  type: "warning" },
  { time: "15:41:32", event: "Transfer initiated",         ref: "TRF_PS_20241015_001",    actor: "paystack", type: "info" },
  { time: "15:42:10", event: "Withdrawal completed",       ref: "WDR_PR_0089",            actor: "paystack", type: "success" },
  { time: "15:42:10", event: "Ledger finalized",           ref: "LDG_00929",              actor: "system",  type: "success" },
];

const PRINCIPLES = [
  {
    title: "Server-side verification",
    desc: "Payments are verified directly with Paystack. Browser redirects are never trusted.",
    mono: "VERIFY → THEN RECORD",
  },
  {
    title: "Immutable split snapshots",
    desc: "When a split is applied to a transaction, it's frozen. Later edits never affect past records.",
    mono: "SNAPSHOT IS PERMANENT",
  },
  {
    title: "Double-entry ledger",
    desc: "Every financial event creates an immutable ledger entry. Balance is always derivable from history.",
    mono: "EVENTS → DERIVED STATE",
  },
  {
    title: "Idempotent operations",
    desc: "Webhooks and withdrawals are processed exactly once, no matter how many times they arrive.",
    mono: "NO DUPLICATE ENTRIES",
  },
];

export default function TrustSection() {
  return (
    <section
      aria-label="Trust and technical guarantees"
      style={{
        background: "var(--surface-light)",
        padding: "var(--section-pad-y) var(--section-pad-x)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="text-label" style={{ color: "var(--text-dark-muted)", marginBottom: 20 }}>
          Built on solid ground
        </div>
        <h2 className="text-display-lg" style={{ color: "var(--text-dark)", marginBottom: 16, maxWidth: 460 }}>
          The system
          <br />
          remembers everything.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-dark-muted)", marginBottom: 64, maxWidth: 440 }}>
          Every payment, split, allocation, and withdrawal leaves an immutable record.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}
          className="trust-grid">

          {/* Audit trail */}
          <div>
            <div className="text-label" style={{ color: "var(--text-dark-muted)", marginBottom: 16 }}>
              Audit trail — SPX-2024-0089
            </div>
            <div style={{
              background: "var(--surface-dark)",
              border: "1px solid var(--border-dark-2)",
              borderRadius: 12,
              overflow: "hidden",
              fontFamily: "var(--font-mono)",
            }}>
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--border-dark)",
                display: "grid",
                gridTemplateColumns: "60px 1fr 100px",
                gap: 12,
              }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Time</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Event</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Ref</span>
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {EVENTS.map((e, i) => (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 100px",
                    gap: 12,
                    alignItems: "center",
                    padding: "8px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{e.time}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: e.type === "success" ? "var(--status-success)"
                          : e.type === "warning" ? "var(--status-pending)"
                          : "var(--status-pending)",
                        opacity: e.type === "info" ? 0.4 : 1,
                      }} />
                      <span style={{ fontSize: 11, color: e.type === "success" ? "var(--text-secondary)" : "var(--text-muted)" }}>
                        {e.event}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.ref}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Principles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {PRINCIPLES.map(p => (
              <div key={p.title} style={{
                background: "white",
                border: "1px solid var(--border-light-2)",
                borderRadius: 12,
                padding: "22px 24px",
              }}>
                <div className="text-mono-sm" style={{
                  color: "var(--text-dark-muted)",
                  marginBottom: 10,
                  letterSpacing: "0.06em",
                }}>
                  {p.mono}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dark)", letterSpacing: "-0.015em", marginBottom: 6 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-dark-muted)", lineHeight: 1.6 }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .trust-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
