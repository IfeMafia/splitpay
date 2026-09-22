"use client";

export default function FeaturesSection() {
  return (
    <section id="features" style={{ background: "#fff", padding: "clamp(80px,11vw,140px) 0" }}>
      <div className="container">

        {/* ── HEADER — copy Image 4 (IPSUM): centered editorial with · label + ● accent dot */}
        <div style={{ textAlign: "center", marginBottom: "clamp(48px,7vw,80px)" }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#bbb", marginBottom: 24,
          }}>
            · About Splitpay
          </div>
          <h2 style={{
            fontSize: "clamp(32px, 4.5vw, 58px)",
            fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
            color: "#0A0A0A", maxWidth: 720, margin: "0 auto",
          }}>
            A payment infrastructure dedicated to building{" "}
            <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#0A0A0A" }}>smarter</em>{" "}
            <span style={{
              display: "inline-block", width: 18, height: 18, borderRadius: "50%",
              background: "#C8FF57", verticalAlign: "middle", margin: "0 6px 4px",
            }} />
            and more transparent collaboration.
          </h2>
        </div>

        {/* ── BENTO GRID — copy Image 4 (IPSUM) exactly: photo card, 100% card, quote card, lime stat, dark stat */}
        <div className="feat-bento" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 12,
        }}>

          {/* CARD 1 — Photo + overlaid stat (Image 4: "120+ people" card with face photo) */}
          <div style={{
            background: "#E8E4DC",
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            minHeight: 280,
            gridRow: "span 1",
          }}>
            {/* Texture/image bg */}
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop"
              alt="Pools preview"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Overlaid content */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "24px",
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 4,
              }}>
                Shared Workspace
              </div>
              <div style={{
                fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em",
                color: "#fff", lineHeight: 1.2,
              }}>
                One link. Agreed splits.
              </div>
            </div>
            {/* Decorative label top */}
            <div style={{ position: "absolute", top: 20, left: 20 }}>
              <div style={{
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                borderRadius: 100, padding: "5px 12px",
                fontSize: 10, fontWeight: 600, color: "#fff", letterSpacing: "0.05em",
              }}>
                Pool Architecture
              </div>
            </div>
          </div>

          {/* CARD 2 — "Commitment 100%" dark card (Image 4 center card) */}
          <div style={{
            background: "#F5F5F5", borderRadius: 20, padding: "32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            border: "1px solid #EBEBEB",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#bbb",
            }}>
              Commitment to transparency
            </div>
            <div>
              <div style={{
                fontSize: "clamp(52px,5vw,72px)", fontWeight: 700,
                letterSpacing: "-0.06em", color: "#0A0A0A", lineHeight: 1,
              }}>
                100%
              </div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 8, lineHeight: 1.5 }}>
                Every allocation is recorded, auditable, and visible to all members.
              </div>
            </div>
          </div>

          {/* CARD 3 — Lime stat card (Image 4: green "520K+ Solutions Power" card) */}
          <div style={{
            background: "#C8FF57", borderRadius: 20, padding: "32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#4A6A00",
            }}>
              Verification
            </div>
            <div>
              <div style={{
                fontSize: 16, fontWeight: 600, color: "#0A0A0A",
                lineHeight: 1.4, marginBottom: 8,
              }}>
                Server-verified before any allocation is created.
              </div>
              <div style={{ fontSize: 13, color: "#4A6A00", lineHeight: 1.5 }}>
                No client-side trust. If the payment isn't confirmed, nothing is recorded.
              </div>
            </div>
          </div>

          {/* CARD 4 — Product Flow Highlight Card */}
          <div style={{
            background: "#0A0A0A", borderRadius: 20, padding: "32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            gridColumn: "span 2",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#444", marginBottom: 20,
            }}>
              The Splitpay flow
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end",
            }}>
              <div>
                <p style={{
                  fontSize: 16, color: "#E0E0E0", lineHeight: 1.6,
                  fontStyle: "italic", fontFamily: "var(--font-serif)",
                  marginBottom: 16,
                }}>
                  "One payment link shared with the client. Verified allocations created server-side with deterministic split math and zero client-side trust."
                </p>
                <div style={{ fontSize: 12, color: "#555" }}>
                  Autonomous payment distribution engine
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Create Pool · configure splits",
                  "Share one payment link",
                  "Payment verified server-side",
                  "Allocations recorded instantly",
                ].map((step, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px",
                    background: i === 3 ? "#fff" : "#111",
                    border: `1px solid ${i === 3 ? "#fff" : "#1A1A1A"}`,
                    borderRadius: 10,
                    fontSize: 12, fontWeight: i === 3 ? 600 : 400,
                    color: i === 3 ? "#0A0A0A" : "#555",
                  }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                      background: i === 3 ? "#0A0A0A" : "#333",
                    }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 5 — Small dark "20+" style card (Image 4: "Continents 20+" bottom right) */}
          <div style={{
            background: "#111", borderRadius: 20, padding: "32px",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            border: "1px solid #1A1A1A",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#444",
            }}>
              Independent withdrawals
            </div>
            <div>
              <div style={{ fontSize: 32, lineHeight: 1, color: "#fff", fontWeight: 300, letterSpacing: "-0.04em", marginBottom: 8 }}>
                ↗
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                Each member sees their balance and withdraws to their own account — independently.
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .feat-bento { grid-template-columns: 1fr 1fr !important; }
          .feat-bento > div[style*="span 2"] { grid-column: span 2 !important; }
        }
        @media (max-width: 600px) {
          .feat-bento { grid-template-columns: 1fr !important; }
          .feat-bento > div[style*="span 2"] { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
}
