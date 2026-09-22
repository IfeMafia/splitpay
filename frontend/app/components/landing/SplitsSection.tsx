"use client";

export default function SplitsSection() {
  const splits = [
    { role: "Producer",   pct: "40%", bar: 40 },
    { role: "Vocalist",   pct: "30%", bar: 30 },
    { role: "Songwriter", pct: "20%", bar: 20 },
    { role: "Mixer",      pct: "10%", bar: 10 },
  ];

  return (
    <section id="solution" style={{
      background: "#fff",
      padding: "clamp(80px,11vw,140px) 0",
      borderTop: "1px solid #F0F0F0",
    }}>
      <div className="container">
        <div className="splits-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(48px,8vw,100px)",
          alignItems: "center",
        }}>

          {/* LEFT — editorial text */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#bbb", marginBottom: 20,
            }}>
              · How splits work
            </div>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
              color: "#0A0A0A", marginBottom: 20,
            }}>
              See exactly where{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#aaa" }}>
                every naira
              </span>{" "}
              goes.
            </h2>
            <p style={{
              fontSize: 15, color: "#888", lineHeight: 1.75,
              maxWidth: 380, marginBottom: 40,
            }}>
              One payment received. Splitpay applies the agreed percentages and creates an allocation for each collaborator instantly — fully recorded, fully transparent.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {[
                { icon: "✓", text: "Server-verified before any allocation is created" },
                { icon: "✓", text: "Permanent audit trail — every split recorded" },
                { icon: "✓", text: "Collaborators withdraw independently, any time" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#0A0A0A", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <a href="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#0A0A0A", color: "#fff",
              padding: "13px 28px", borderRadius: 100,
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              transition: "background 140ms",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              Start for free
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          {/* RIGHT — clean light card, no dark bg */}
          <div style={{
            background: "#F9F9F9",
            border: "1px solid #EBEBEB",
            borderRadius: 24,
            padding: "36px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.04)",
          }}>
            {/* Pool header */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 28,
              paddingBottom: 20, borderBottom: "1px solid #EBEBEB",
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#bbb", marginBottom: 6,
                }}>
                  Highland Studio Session
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>
                  Payment received
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#F0FFF4", border: "1px solid #BBF7D0",
                borderRadius: 100, padding: "6px 12px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A" }}>Verified</span>
              </div>
            </div>

            {/* Split rows */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#ccc",
                marginBottom: 12,
              }}>
                <span>Collaborator</span>
                <div style={{ display: "flex", gap: 32 }}>
                  <span>Share</span>
                  <span>Amount</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {splits.map((s, i) => (
                  <div key={i}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 7,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#444" }}>{s.role}</span>
                      <span style={{ fontSize: 12, color: "#999", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{s.pct}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: "#F0F0F0", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", width: `${s.bar}%`,
                        background: "#0A0A0A", borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              paddingTop: 20, borderTop: "1px solid #EBEBEB",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#999",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Every allocation recorded · Withdrawable instantly
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .splits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
