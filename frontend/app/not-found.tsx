"use client";

import Link from "next/link";
import LandingNav from "./components/landing/LandingNav";
import LandingFooter from "./components/landing/LandingFooter";

export default function NotFound() {
  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Fixed top navigation */}
      <LandingNav />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(130px, 16vw, 180px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glowing Background Radial Accents */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(circle, rgba(200, 255, 87, 0.12) 0%, rgba(10, 10, 10, 0) 70%)",
            pointerEvents: "none",
            zIndex: 0,
            filter: "blur(60px)",
          }}
        />

        <div
          className="container"
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          {/* Top Status Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "6px 16px",
              borderRadius: 100,
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#C8FF57",
                boxShadow: "0 0 10px #C8FF57",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              404 // Page Not Found
            </span>
          </div>

          {/* Large Hero 404 Visual Header */}
          <div style={{ marginBottom: 24, position: "relative" }}>
            <div
              style={{
                fontSize: "clamp(80px, 14vw, 150px)",
                fontWeight: 700,
                lineHeight: 0.9,
                letterSpacing: "-0.06em",
                color: "rgba(255, 255, 255, 0.03)",
                userSelect: "none",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -60%)",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono)",
                pointerEvents: "none",
              }}
            >
              404 ERROR
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 5.5vw, 64px)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
                margin: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              Lost in{" "}
              <em
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "#C8FF57",
                  fontWeight: 400,
                }}
              >
                distribution
              </em>
              ?
            </h1>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "clamp(15px, 1.2vw, 17px)",
              color: "#999999",
              lineHeight: 1.65,
              maxWidth: 500,
              margin: "0 auto 36px",
              fontWeight: 300,
            }}
          >
            The payment pool link or page you were looking for couldn&apos;t be located. It may have been relocated, deleted, or never existed.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 56,
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#C8FF57",
                color: "#0A0A0A",
                padding: "13px 26px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 150ms ease",
                boxShadow: "0 2px 14px rgba(200, 255, 87, 0.2)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "#B4F046";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "#C8FF57";
                el.style.transform = "translateY(0)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Return to Home
            </Link>

            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#161616",
                color: "#F5F5F5",
                border: "1px solid #2A2A2A",
                padding: "13px 24px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "#222222";
                el.style.borderColor = "#383838";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "#161616";
                el.style.borderColor = "#2A2A2A";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8FF57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          {/* Bento Help Card */}
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #1E1E1E",
              borderRadius: 20,
              padding: "24px 28px",
              textAlign: "left",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#666666",
                marginBottom: 16,
              }}
            >
              Looking for something specific?
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
              className="not-found-grid"
            >
              {[
                { title: "How it works", href: "/#how-it-works", desc: "Understand split pools" },
                { title: "Features", href: "/#features", desc: "Explore platform tools" },
                { title: "Pricing", href: "/#pricing", desc: "Simple transparent plans" },
                { title: "FAQ", href: "/#faq", desc: "Common questions & support" },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  style={{
                    display: "block",
                    backgroundColor: "#161616",
                    border: "1px solid #222222",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textDecoration: "none",
                    transition: "all 140ms ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = "#1A1A1A";
                    el.style.borderColor = "#333333";
                    el.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.backgroundColor = "#161616";
                    el.style.borderColor = "#222222";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "#FFFFFF" }}>{item.title}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8FF57" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#777777", fontWeight: 300 }}>{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />

      <style>{`
        @media (max-width: 520px) {
          .not-found-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
