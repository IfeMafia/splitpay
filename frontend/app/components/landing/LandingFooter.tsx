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
            {["Overview", "Features", "GitHub", "Devpost"].map(l => (
              <a key={l} href="#" style={{
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
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
            fontSize: "clamp(18px, 3vw, 32px)",
            fontWeight: 300, letterSpacing: "-0.03em",
            color: "#FFF", textDecoration: "none",
            transition: "color 140ms",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C8FF57"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#FFF"; }}
          >
            github.com/splitpay
          </a>
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
              Payment allocation infrastructure for collaborative creative work. Built as an open-source project for the hackathon.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 16 }}>Project</div>
            {["Source Code", "Documentation", "Devpost"].map(l => (
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
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 16 }}>Creators</div>
            {["Team Profile", "Twitter", "LinkedIn"].map(l => (
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
              Built for the Hackathon · {new Date().getFullYear()}
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
