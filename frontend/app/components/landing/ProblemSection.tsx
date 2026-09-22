"use client";

import { useEffect, useRef } from "react";

/* Lightweight scroll reveal — no library needed */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const painPoints = [
  { text: "One person manually collects the full payment", bad: false },
  { text: "Calculates everyone's cut with a calculator", bad: false },
  { text: "Makes separate bank transfers one by one", bad: false },
  { text: "Tracks who's been paid in a spreadsheet", bad: true },
  { text: "\"Wait — how much was my share again?\"", bad: true },
  { text: "Errors, re-do transfers, broken trust.", bad: true },
];

export default function ProblemSection() {
  const ref = useReveal();

  return (
    <section
      id="problem"
      style={{ background: "#fff", padding: "clamp(80px,11vw,140px) 0", borderTop: "1px solid #F0F0F0" }}
    >
      <div className="container">
        <div ref={ref} className="problem-grid reveal-block" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(48px,8vw,100px)",
          alignItems: "center",
        }}>

          {/* LEFT */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#bbb", marginBottom: 20,
            }}>
              · The problem
            </div>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 54px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.08,
              color: "#0A0A0A", marginBottom: 20,
            }}>
              One person collects.
              <br />
              <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#C0C0C0", fontWeight: 400 }}>
                Everyone else waits.
              </em>
            </h2>
            <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, maxWidth: 380, marginBottom: 44 }}>
              Without a system, paying multiple collaborators is a manual, error-prone process that strains relationships and wastes time.
            </p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {painPoints.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "13px 0",
                  borderBottom: i < painPoints.length - 1 ? "1px solid #F5F5F5" : "none",
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: p.bad ? "#FEF2F2" : "#F5F5F5",
                    border: `1px solid ${p.bad ? "#FECACA" : "#E8E8E8"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: p.bad ? "#EF4444" : "#ccc", marginTop: 1,
                    fontWeight: 700,
                  }}>
                    {p.bad ? "✕" : ""}
                  </span>
                  <span style={{
                    fontSize: 14,
                    color: p.bad ? "#DC2626" : "#888",
                    fontWeight: p.bad ? 500 : 400,
                    fontStyle: p.text.startsWith('"') ? "italic" : "normal",
                    lineHeight: 1.55,
                  }}>
                    {p.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — before/after, no amounts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{
              background: "#FFFAFA", border: "1px solid #FECACA",
              borderRadius: 20, padding: "28px",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#EF4444", marginBottom: 16,
              }}>
                Without Splitpay
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "WhatsApp group: \"Who got what?\"",
                  "3 separate bank transfers",
                  "Manual spreadsheet tracking",
                  "One person holds all the money",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#B91C1C" }}>
                    <span style={{ color: "#FCA5A5", fontWeight: 700, fontSize: 11 }}>—</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: "#F0FFF4", border: "1px solid #BBF7D0",
              borderRadius: 20, padding: "28px",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#16A34A", marginBottom: 16,
              }}>
                With Splitpay
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Splits agreed upfront, recorded automatically",
                  "One payment link shared with the client",
                  "Allocations created instantly on payment",
                  "Each member withdraws independently",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#166534" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    {t}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .problem-grid { grid-template-columns: 1fr !important; }
        }
        .reveal-block { opacity: 0; transform: translateY(24px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
        .reveal-block.revealed { opacity: 1; transform: translateY(0); }
      `}</style>
    </section>
  );
}
