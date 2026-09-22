"use client";

import Link from "next/link";

export default function FinalCTASection() {
  return (
    <section
      aria-label="Get started with Splitpay"
      style={{
        background: "#0A0A0A",
        padding: "clamp(100px, 14vw, 160px) 0",
        position: "relative",
      }}
    >
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>

          {/* Label pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 100, padding: "7px 18px", marginBottom: 36,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8FF57" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#E0E0E0", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Ready to start?
            </span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontSize: "clamp(44px, 6.5vw, 88px)",
            fontWeight: 300,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#FFF",
            marginBottom: 24,
          }}>
            One payment.
            <br />
            <em style={{
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
              color: "#C8FF57",
            }}>
              Everyone gets paid.
            </em>
          </h2>

          <p style={{
            fontSize: "clamp(16px, 1.5vw, 18px)",
            color: "#999",
            maxWidth: 480,
            margin: "0 auto 48px",
            lineHeight: 1.7,
            fontWeight: 300,
          }}>
            Stop chasing invoices and calculating cuts. Share one link and let Splitpay handle the rest.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#C8FF57", color: "#0A0A0A",
                padding: "16px 36px", borderRadius: 100,
                fontSize: 14, fontWeight: 500,
                textDecoration: "none",
                transition: "background 140ms, transform 140ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#b5e64e";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#C8FF57";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              Create a free Pool
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.05)", color: "#FFF",
                padding: "16px 32px", borderRadius: 100,
                fontSize: 14, fontWeight: 400,
                border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                transition: "border-color 140ms, background 140ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
              View on GitHub
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
