import Link from "next/link";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100vh", display: "flex", backgroundColor: "#fff", overflow: "hidden" }}>
      {/* Left Branding Panel (Desktop Only) */}
      <div 
        className="auth-brand-panel"
        style={{
          flex: 1,
          backgroundColor: "#0A0A0A",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(40px, 5vw, 64px)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Subtle geometric background texture / overlay */}
        <div 
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1400&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
            mixBlendMode: "luminosity",
            zIndex: 0,
          }}
        />

        {/* Top: Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#C8FF57" />
                <circle cx="7" cy="18" r="3.2" fill="#C8FF57" fillOpacity="0.4" />
                <circle cx="15.5" cy="18" r="3.2" fill="#C8FF57" fillOpacity="0.15" />
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 500, color: "#fff", letterSpacing: "-0.03em", fontFamily: "var(--font-sans)" }}>
              Splitpay
            </span>
          </Link>
        </div>

        {/* Center: Custom Geometric Art (One to Many Distribution) */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "20px 0", minHeight: 0 }}>
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", maxHeight: "340px", objectFit: "contain" }}>
            <defs>
              <clipPath id="center-img">
                <circle cx="200" cy="200" r="32" />
              </clipPath>
              <clipPath id="tl-img">
                <circle cx="100" cy="100" r="24" />
              </clipPath>
              <clipPath id="tr-img">
                <circle cx="300" cy="90" r="30" />
              </clipPath>
              <clipPath id="br-img">
                <circle cx="320" cy="280" r="20" />
              </clipPath>
              <clipPath id="bl-img">
                <circle cx="90" cy="290" r="28" />
              </clipPath>
            </defs>

            {/* Hand-drawn style connecting arrows */}
            {/* To Top Left */}
            <path d="M175 175 Q150 120 120 115" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M120 115 L130 125 M120 115 L132 108" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* To Top Right */}
            <path d="M225 175 Q260 140 285 115" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M285 115 L275 125 M285 115 L272 110" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* To Bottom Right */}
            <path d="M225 225 Q270 260 305 270" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M305 270 L295 260 M305 270 L292 275" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* To Bottom Left */}
            <path d="M175 225 Q130 260 110 275" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M110 275 L120 265 M110 275 L122 282" fill="none" stroke="#C8FF57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Target Nodes with Images */}
            {/* Top Left */}
            <circle cx="100" cy="100" r="26" fill="#1A1A1A" stroke="#C8FF57" strokeWidth="2" />
            <image href="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" x="70" y="70" width="60" height="60" clipPath="url(#tl-img)" preserveAspectRatio="xMidYMid slice" />
            
            {/* Top Right */}
            <circle cx="300" cy="90" r="32" fill="#1A1A1A" stroke="#C8FF57" strokeWidth="2" />
            <image href="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" x="260" y="50" width="80" height="80" clipPath="url(#tr-img)" preserveAspectRatio="xMidYMid slice" />
            
            {/* Bottom Right */}
            <circle cx="320" cy="280" r="22" fill="#1A1A1A" stroke="#C8FF57" strokeWidth="2" />
            <image href="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" x="290" y="250" width="60" height="60" clipPath="url(#br-img)" preserveAspectRatio="xMidYMid slice" />
            
            {/* Bottom Left */}
            <circle cx="90" cy="290" r="30" fill="#1A1A1A" stroke="#C8FF57" strokeWidth="2" />
            <image href="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" x="50" y="250" width="80" height="80" clipPath="url(#bl-img)" preserveAspectRatio="xMidYMid slice" />

            {/* Central Node (The Payer / Source) */}
            <circle cx="200" cy="200" r="36" fill="#C8FF57" />
            <circle cx="200" cy="200" r="34" fill="#0A0A0A" />
            <image href="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop" x="160" y="160" width="80" height="80" clipPath="url(#center-img)" preserveAspectRatio="xMidYMid slice" />
            
            {/* Pulsing ring effect for the central node (simulated with static rings for crispness) */}
            <circle cx="200" cy="200" r="54" stroke="#C8FF57" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="200" cy="200" r="74" stroke="#C8FF57" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="200" cy="200" r="94" stroke="#C8FF57" strokeWidth="1" strokeOpacity="0.05" />
          </svg>
        </div>

        {/* Bottom: Quote / Value Prop */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
          <h2 style={{ 
            fontSize: "clamp(28px, 3.5vw, 42px)", 
            fontWeight: 300, 
            letterSpacing: "-0.03em", 
            lineHeight: 1.1,
            marginBottom: 16
          }}>
            One payment.
            <br />
            <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#C8FF57" }}>
              Everyone gets paid.
            </em>
          </h2>
          <p style={{ fontSize: 14, color: "#999", lineHeight: 1.6, fontWeight: 300, paddingRight: 20 }}>
            The financial coordination layer for collaborative work. Create a Pool, agree on splits, and let the system handle the rest.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div 
        className="auth-form-panel"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(32px, 5vw, 80px)",
          position: "relative",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400, margin: "auto" }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-brand-panel { display: none !important; }
          .auth-form-panel { padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
