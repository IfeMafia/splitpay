"use client";

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer style={{ background: "#0A0A0A", color: "#FFF", borderTop: "1px solid #1A1A1A" }}>
      <div className="container">

        {/* ── TOP ROW */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "clamp(40px,6vw,64px) 0 32px",
          borderBottom: "1px solid #1A1A1A",
          flexWrap: "wrap",
          gap: 24,
        }}>
          {/* Left nav links */}
          <div className="footer-top-nav" style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
            {["Overview", "How it works", "Features", "Pricing", "FAQ"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} style={{
                fontSize: 13, color: "#888", textDecoration: "none", fontWeight: 400,
                transition: "color 140ms",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FFF"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Right — Project Link */}
          <span style={{
            fontSize: "clamp(13px, 1.4vw, 15px)",
            fontWeight: 300,
            color: "#555",
            letterSpacing: "-0.01em",
          }}>
            Payment distribution for collaborative teams.
          </span>
        </div>

        {/* ── MIDDLE COLUMNS */}
        <div className="footer-cols" style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr 1fr",
          gap: 40,
          padding: "40px 0",
          borderBottom: "1px solid #1A1A1A",
        }}>

          {/* Col 1 */}
          <div>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, maxWidth: 260, fontWeight: 300 }}>
              One payment link. Agreed splits. Everyone gets paid. Splitpay handles payment distribution for any team working together on a project.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 16 }}>Product</div>
            {["How it works", "Features", "FAQ", "Sign up"].map(l => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Link href="#" style={{ fontSize: 13, color: "#888", textDecoration: "none", transition: "color 140ms", fontWeight: 300 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FFF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
                >{l}</Link>
              </div>
            ))}
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 16 }}>Company</div>
            {["About", "Contact", "Terms", "Privacy"].map(l => (
              <div key={l} style={{ marginBottom: 10 }}>
                <Link href="#" style={{ fontSize: 13, color: "#888", textDecoration: "none", transition: "color 140ms", fontWeight: 300 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#FFF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
                >{l}</Link>
              </div>
            ))}
          </div>

        </div>

        {/* ── BOTTOM */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "32px 0 clamp(32px,5vw,56px)",
          flexWrap: "wrap",
          gap: 24,
        }}>

          {/* Giant wordmark */}
          <div style={{
            fontSize: "clamp(52px, 10vw, 110px)",
            fontWeight: 500, letterSpacing: "-0.05em",
            color: "#FFF", lineHeight: 1,
            userSelect: "none",
          }}>
            Splitpay
          </div>

          {/* Legal bottom right */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: "#555", fontWeight: 300 }}>
              &copy; {new Date().getFullYear()} Splitpay. All rights reserved.
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-cols { grid-template-columns: 1fr 1fr !important; }
          .footer-cols > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .footer-cols { grid-template-columns: 1fr !important; }
          .footer-top-nav { display: none !important; }
        }
      `}</style>
    </footer>
  );
}
