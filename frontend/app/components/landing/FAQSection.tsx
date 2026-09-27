"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is Splitpay?",
    a: "Splitpay is a payment-distribution platform for collaborative projects. A Pool creator adds collaborators, defines the agreed split, and creates one payment link. Once verified, Splitpay records the exact allocation for each collaborator automatically.",
  },
  {
    q: "Who decides the split percentage?",
    a: "The collaborators do. Splitpay doesn't decide who owns what — the Pool creator configures the agreed percentages, and Splitpay enforces and records them.",
  },
  {
    q: "How does payment verification work?",
    a: "Every payment is verified server-side before any allocations are created. Nothing is processed based solely on what the client reports — it's independently confirmed.",
  },
  {
    q: "What happens after a payment is received?",
    a: "Splitpay applies the agreed split and creates an allocation for each collaborator. It becomes part of the project's permanent, auditable payment record.",
  },
  {
    q: "How do collaborators withdraw their share?",
    a: "Collaborators can view their available balance and request a withdrawal at any time — no manual intervention from the pool creator required.",
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" style={{ background: "#fff", padding: "clamp(80px,11vw,140px) 0", borderTop: "1px solid #F0F0F0" }}>
      <div className="container">
        <div className="faq-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "clamp(40px,8vw,100px)",
          alignItems: "start",
        }}>

          {/* Left — editorial heading + real photo */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#bbb", marginBottom: 20,
            }}>
              · Common questions
            </div>
            <h2 style={{
              fontSize: "clamp(26px, 3vw, 42px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.15,
              color: "#0A0A0A", marginBottom: 20,
            }}>
              Split payments made{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#aaa" }}>
                genuinely easy
              </span>
            </h2>
            <p style={{ fontSize: 14, color: "#999", lineHeight: 1.7, maxWidth: 360, marginBottom: 40 }}>
              Built for any team that works together on a project and gets paid by a client — without the admin overhead.
            </p>

            {/* Photo — real, clean, no dark overlay */}
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop"
                alt="Creative collaboration"
                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
              />
              {/* Feature note — clean card */}
              <div style={{
                position: "absolute", bottom: 16, left: 16, right: 16,
                background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
                borderRadius: 14, padding: "14px 18px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", lineHeight: 1.4, margin: 0, marginBottom: 4 }}>
                  &ldquo;One payment in. Every collaborator paid out. No manual transfers.&rdquo;
                </p>
                <div style={{ fontSize: 11, color: "#888" }}>How Splitpay works</div>
              </div>
            </div>
          </div>

          {/* Right — clean light accordion */}
          <div style={{ paddingTop: 40 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid #F0F0F0" }}>
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  style={{
                    width: "100%", textAlign: "left", background: "none", border: "none",
                    padding: "22px 0", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{
                    fontSize: 15, fontWeight: 500,
                    color: openIdx === i ? "#0A0A0A" : "#666",
                    transition: "color 180ms",
                  }}>
                    {faq.q}
                  </span>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: openIdx === i ? "#0A0A0A" : "#F0F0F0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 200ms, transform 200ms",
                    transform: openIdx === i ? "rotate(45deg)" : "none",
                    color: openIdx === i ? "#fff" : "#888",
                    fontSize: 16, lineHeight: 1,
                  }}>
                    +
                  </span>
                </button>
                <div style={{
                  maxHeight: openIdx === i ? 240 : 0,
                  opacity: openIdx === i ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 300ms ease, opacity 250ms ease",
                  paddingBottom: openIdx === i ? 22 : 0,
                }}>
                  <p style={{ margin: 0, color: "#888", fontSize: 14, lineHeight: 1.7, maxWidth: 520 }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .faq-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
