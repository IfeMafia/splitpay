"use client";

import { useState } from "react";

export default function HeroSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://splitpay.io/p/highland-session");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section style={{
      backgroundColor: "#0A0A0A",
      backgroundImage: "url('https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1400&auto=format&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundBlendMode: "luminosity",
      position: "relative",
      paddingTop: "clamp(110px, 14vw, 160px)",
      paddingBottom: "clamp(60px, 8vw, 100px)",
      overflow: "hidden",
    }}>
      {/* Dark overlay to ensure text remains readable against the background */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(10, 10, 10, 0.85)",
        zIndex: 0,
      }} />

      <div className="container" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* ── ROW 1: Authentic Headline + Description + CTAs */}
        <div className="hero-top-row" style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "clamp(32px, 5vw, 64px)",
          alignItems: "start",
          marginBottom: "clamp(40px, 6vw, 60px)",
        }}>
          {/* LEFT: Editorial Headline */}
          <div>
            <h1 style={{
              fontSize: "clamp(38px, 5.2vw, 66px)",
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              color: "#fff",
              margin: 0,
            }}>
              One payment.
              <br />
              Everyone gets
              <br />
              <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#C8FF57", fontWeight: 400 }}>
                their share.
              </em>
            </h1>
          </div>

          {/* RIGHT: Clear Platform Value + Direct Actions */}
          <div style={{ paddingTop: "clamp(6px, 1.5vw, 18px)" }}>
            <p style={{
              fontSize: "clamp(14.5px, 1.1vw, 15.5px)",
              color: "#999",
              lineHeight: 1.7,
              marginBottom: 26,
              maxWidth: 420,
            }}>
              Share one payment link with your client. When they pay, Splitpay automatically calculates and records each collaborator&apos;s allocation with server-verified accuracy.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#C8FF57",
                  color: "#0A0A0A",
                  padding: "13px 26px",
                  borderRadius: 100,
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 140ms ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "#B4F046";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "#C8FF57";
                  el.style.transform = "translateY(0)";
                }}
              >
                Start for free
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>

              <a
                href="#how-it-works"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "#ccc",
                  textDecoration: "none",
                  padding: "10px 14px",
                  borderRadius: 8,
                  transition: "color 140ms ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
              >
                See how it works
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── ROW 2: The UI Bento Grid */}
        <div className="hero-bento" style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.85fr 0.9fr",
          gridTemplateRows: "240px 240px",
          gap: 16,
        }}>

          {/* 1. TILE A (Top-Left): Interactive Split Pool UI Card */}
          <div style={{
            backgroundColor: "#F7F6F3",
            borderRadius: 22,
            padding: "24px 26px",
            border: "1px solid #EBE8E2",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>
                    Active Pool
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#059669",
                    backgroundColor: "#DCFCE7",
                    padding: "2px 8px",
                    borderRadius: 100,
                  }}>
                    Verified
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                  $4,800.00
                </span>
              </div>

              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 14 }}>
                Highland Studio Session
              </div>

              {/* Splits List */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {[
                  { role: "Producer", pct: 40, amt: "$1,920" },
                  { role: "Vocalist", pct: 30, amt: "$1,440" },
                  { role: "Songwriter", pct: 20, amt: "$960" },
                  { role: "Mixer", pct: 10, amt: "$480" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: "#444", fontWeight: 500 }}>{s.role}</span>
                      <span style={{ color: "#888", fontFamily: "var(--font-mono)" }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: "#E2DFD8", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, backgroundColor: "#0A0A0A", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment link box */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #E8E5DF",
            }}>
              <span style={{ fontSize: 11, color: "#777", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                splitpay.io/p/highland-session
              </span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: copied ? "#059669" : "#0A0A0A",
                  backgroundColor: copied ? "#DCFCE7" : "#F0EFEA",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 120ms",
                }}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          {/* 2. TILE B (Top-Middle): Dark Verified Allocation Counter */}
          <div style={{
            backgroundColor: "#0D0D0D",
            borderRadius: 22,
            padding: "24px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "#fff",
            position: "relative",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666" }}>
                  Allocations
                </span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981" }} />
              </div>

              {/* Avatars */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                {["P", "V", "S", "M"].map((initial, i) => (
                  <div key={i} style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: ["#fff", "#262626", "#383838", "#1F1F1F"][i],
                    color: i === 0 ? "#0A0A0A" : "#aaa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    border: "2px solid #0D0D0D",
                  }}>
                    {initial}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "clamp(32px, 3.2vw, 42px)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 6,
                fontFamily: "var(--font-mono)",
              }}>
                100%
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>
                Server-verified payouts. Each collaborator withdraws their own share directly.
              </p>
            </div>
          </div>

          {/* 3. TILE C (Right, Spans 2 rows): Real Collaborator Visual with Live Payment Overlay */}
          <div style={{
            gridRow: "span 2",
            borderRadius: 22,
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#222",
          }}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
              alt="Creative collaborator"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Gradient overlay for text contrast */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
            }} />

            {/* Top Floating Badge */}
            <div style={{
              position: "absolute",
              top: 16,
              left: 16,
              backgroundColor: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              padding: "6px 12px",
              borderRadius: 100,
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0A0A0A" }}>1 Link · Zero Math</span>
            </div>

            {/* Bottom Card Notification */}
            <div style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(16px)",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>
                  Invoice Paid
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                  +$4,800.00
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0A0A0A" }}>
                4 allocations ready to withdraw
              </div>
            </div>
          </div>

          {/* 4. TILE D (Bottom-Left): Vibrant Indigo Multi-Party Split Card */}
          <div style={{
            backgroundColor: "#4F46E5",
            borderRadius: 22,
            padding: "24px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "#fff",
          }}>
            <div>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>

              <div style={{ fontSize: "clamp(24px, 2.4vw, 30px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Instant split records
              </div>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, margin: 0 }}>
              Automatic allocation calculations on every inbound invoice. Zero spreadsheets, zero human error.
            </p>
          </div>

          {/* 5. TILE E (Bottom-Middle): Studio Workspace Photo */}
          <div style={{
            borderRadius: 22,
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#222",
          }}>
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Creative collective workspace"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: 100,
              fontSize: 10.5,
              fontWeight: 500,
              color: "#fff",
            }}>
              Music · Design · Film
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-top-row {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .hero-bento {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto !important;
          }
          .hero-bento > div {
            min-height: 230px !important;
          }
        }
        @media (max-width: 640px) {
          .hero-bento {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
