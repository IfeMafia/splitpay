"use client";

/* Editorial shift moment — FROM/TO large typography */

export default function ShiftSection() {
  return (
    <section
      aria-label="The shift in payment distribution"
      style={{
        background: "var(--surface-dark)",
        padding: "var(--section-pad-y) var(--section-pad-x)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ONE → MANY decorative motif */}
      <div aria-hidden="true" style={{
        position: "absolute",
        right: "clamp(20px, 6vw, 96px)",
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.04,
        pointerEvents: "none",
      }}>
        <BranchMotif />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* FROM */}
        <div style={{ marginBottom: 48 }}>
          <div className="text-label" style={{ color: "var(--text-muted)", marginBottom: 14 }}>
            The old question
          </div>
          <div
            className="text-display-xl"
            style={{
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontFamily: "var(--font-playfair)",
              fontWeight: 400,
              lineHeight: 1.0,
              maxWidth: 680,
            }}
          >
            "Who should I send
            <br />
            this money to?"
          </div>
        </div>

        {/* Arrow */}
        <div style={{ marginBottom: 48, paddingLeft: 4 }}>
          <svg width="32" height="64" viewBox="0 0 32 64" fill="none" aria-hidden="true">
            <line x1="16" y1="0" x2="16" y2="52" stroke="var(--border-dark-2)" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d="M8 48l8 12 8-12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        {/* TO */}
        <div style={{ marginBottom: 72 }}>
          <div className="text-label" style={{ color: "var(--accent)", marginBottom: 14 }}>
            With Splitpay
          </div>
          <div
            className="text-display-xl"
            style={{
              color: "var(--text-primary)",
              lineHeight: 1.0,
              maxWidth: 800,
            }}
          >
            Everyone already has
            <br />
            their allocation.
          </div>
        </div>

        {/* Supporting detail */}
        <div style={{
          display: "flex",
          gap: 40,
          flexWrap: "wrap",
        }}>
          {[
            { label: "Agreed by the team", desc: "Collaborators define the split together. Splitpay doesn't decide." },
            { label: "Executed automatically", desc: "One payment becomes structured allocations the moment it's verified." },
            { label: "Permanently recorded", desc: "Every distribution is immutably logged. No spreadsheet needed." },
          ].map(item => (
            <div key={item.label} style={{ flex: "1 1 200px", maxWidth: 280 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.01em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BranchMotif() {
  return (
    <svg width="320" height="400" viewBox="0 0 320 400" fill="none">
      {/* Trunk */}
      <line x1="160" y1="0" x2="160" y2="120" stroke="white" strokeWidth="2" />
      {/* Branch 1 */}
      <line x1="160" y1="120" x2="60" y2="200" stroke="white" strokeWidth="2" />
      <line x1="60" y1="200" x2="60" y2="400" stroke="white" strokeWidth="2" />
      {/* Branch 2 */}
      <line x1="160" y1="140" x2="130" y2="220" stroke="white" strokeWidth="2" />
      <line x1="130" y1="220" x2="130" y2="400" stroke="white" strokeWidth="2" />
      {/* Branch 3 */}
      <line x1="160" y1="150" x2="210" y2="220" stroke="white" strokeWidth="2" />
      <line x1="210" y1="220" x2="210" y2="400" stroke="white" strokeWidth="2" />
      {/* Branch 4 */}
      <line x1="160" y1="120" x2="280" y2="200" stroke="white" strokeWidth="2" />
      <line x1="280" y1="200" x2="280" y2="400" stroke="white" strokeWidth="2" />
      {/* Dots */}
      {[60, 130, 210, 280].map(x => (
        <circle key={x} cx={x} cy="240" r="5" fill="white" />
      ))}
    </svg>
  );
}
