"use client";

export default function PricingSection() {
  const breakdown = [
    {
      label: "Client pays",
      amount: "₦100,000",
      sub: "One payment. One link.",
      highlight: false,
      negative: false,
    },
    {
      label: "Payment processing fee",
      amount: "−₦1,600",
      sub: "Charged by Paystack (1.5% + ₦100). This is the card processing fee — standard across all Nigerian payment platforms.",
      highlight: false,
      negative: true,
    },
    {
      label: "Splitpay platform fee",
      amount: "−₦5,000",
      sub: "Our 5% fee. This is how we keep the lights on.",
      highlight: false,
      negative: true,
    },
    {
      label: "Your team receives",
      amount: "₦93,400",
      sub: "Distributed instantly across all collaborators based on the agreed split.",
      highlight: true,
      negative: false,
    },
  ];

  return (
    <section
      id="pricing"
      aria-label="Splitpay pricing"
      style={{ background: "#F9F9F9", padding: "clamp(80px,11vw,140px) 0", borderTop: "1px solid #F0F0F0" }}
    >
      <div className="container">

        {/* ── HEADER */}
        <div style={{ marginBottom: "clamp(48px,7vw,80px)" }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#bbb", marginBottom: 20,
          }}>
            · Pricing
          </div>
          <div className="pricing-header" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "clamp(24px,4vw,64px)", alignItems: "end",
          }}>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
              color: "#0A0A0A", margin: 0,
            }}>
              No monthly fees.{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#aaa" }}>
                Pay only when you get paid.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: "#888", lineHeight: 1.75, maxWidth: 380, margin: 0 }}>
              Splitpay charges a small fee only when a client payment comes through. If no payment happens, you pay nothing.
            </p>
          </div>
        </div>

        {/* ── MAIN CONTENT: breakdown + key points */}
        <div className="pricing-grid" style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "clamp(32px,5vw,64px)",
          alignItems: "start",
        }}>

          {/* LEFT — payment breakdown */}
          <div style={{
            background: "#fff",
            border: "1px solid #EBEBEB",
            borderRadius: 24,
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              padding: "22px 28px",
              borderBottom: "1px solid #F0F0F0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 4 }}>
                  Example breakdown
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>
                  What happens to a ₦100,000 payment
                </div>
              </div>
              <div style={{
                background: "#F0FFF4", border: "1px solid #BBF7D0",
                borderRadius: 100, padding: "5px 12px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#16A34A" }}>Verified</span>
              </div>
            </div>

            {/* Breakdown rows */}
            <div style={{ padding: "4px 0" }}>
              {breakdown.map((row, i) => (
                <div
                  key={i}
                  style={{
                    padding: "20px 28px",
                    borderBottom: i < breakdown.length - 1 ? "1px solid #F5F5F5" : "none",
                    background: row.highlight ? "#0A0A0A" : "transparent",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 5,
                    gap: 16,
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: row.highlight ? 600 : 500,
                      color: row.highlight ? "#fff" : "#0A0A0A",
                    }}>
                      {row.label}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: row.highlight ? "#C8FF57" : row.negative ? "#EF4444" : "#0A0A0A",
                      flexShrink: 0,
                    }}>
                      {row.amount}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: row.highlight ? "rgba(255,255,255,0.55)" : "#aaa",
                    lineHeight: 1.55, margin: 0,
                  }}>
                    {row.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — simple value points */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Big callout */}
            <div style={{
              background: "#C8FF57", borderRadius: 20, padding: "32px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A6A00", marginBottom: 16 }}>
                Platform fee
              </div>
              <div style={{ fontSize: "clamp(48px,5vw,64px)", fontWeight: 700, letterSpacing: "-0.06em", color: "#0A0A0A", lineHeight: 1 }}>
                5%
              </div>
              <div style={{ fontSize: 13, color: "#4A6A00", marginTop: 10, lineHeight: 1.6 }}>
                Only charged when a payment is received. Zero fee if no payment comes in.
              </div>
            </div>

            {/* What is free */}
            <div style={{
              background: "#fff", border: "1px solid #EBEBEB",
              borderRadius: 20, padding: "28px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 18 }}>
                Always free
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Create a project pool",
                  "Add collaborators",
                  "Agree on split percentages",
                  "Generate a payment link",
                  "View your allocation history",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ fontSize: 13, color: "#444" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* No surprises note */}
            <div style={{
              background: "#F9F9F9", border: "1px solid #EBEBEB",
              borderRadius: 16, padding: "18px 22px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <p style={{ fontSize: 12.5, color: "#888", lineHeight: 1.6, margin: 0 }}>
                The payment processing fee (1.5% + ₦100) is charged by <strong style={{ color: "#555" }}>Paystack</strong>, the card processor. It applies to all Nigerian payments — we don't control or keep that fee.
              </p>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-header { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
