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
              href="#how-it-works"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              See how it works
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
