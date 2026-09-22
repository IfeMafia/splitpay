"use client";

/* How Splitpay works — continuous visual workflow sequence */

const STEPS = [
  {
    n: "01",
    title: "Create a Pool",
    desc: "Name your project. A Pool is the shared workspace for your collaborative payment.",
    ui: <PoolCreateUI />,
  },
  {
    n: "02",
    title: "Add collaborators",
    desc: "Invite by email or share an invite code. Collaborators join and become part of the Pool.",
    ui: <CollaboratorsUI />,
  },
  {
    n: "03",
    title: "Agree on the split",
    desc: "Set percentages together. Equal or custom — the team decides. Total must reach 100%.",
    ui: <SplitUI />,
  },
  {
    n: "04",
    title: "Share one payment link",
    desc: "Generate a single public link. Your client pays without creating an account.",
    ui: <PaymentLinkUI />,
  },
  {
    n: "05",
    title: "Payment is verified",
    desc: "Splitpay verifies the payment server-side. The Pool balance updates automatically.",
    ui: <VerifyUI />,
  },
  {
    n: "06",
    title: "Allocations are created",
    desc: "The agreed split is applied to the verified amount. Each member's entitlement is recorded.",
    ui: <AllocationsUI />,
  },
  {
    n: "07",
    title: "Collaborators withdraw",
    desc: "Members see their available balance and request withdrawal when ready.",
    ui: <WithdrawUI />,
  },
];

export default function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      aria-label="How Splitpay works"
      style={{
        background: "var(--surface-light)",
        padding: "var(--section-pad-y) var(--section-pad-x)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="text-label" style={{ color: "var(--text-dark-muted)", marginBottom: 20 }}>
          How it works
        </div>
        <h2 className="text-display-lg" style={{ color: "var(--text-dark)", marginBottom: 72, maxWidth: 460 }}>
          Seven steps.
          <br />
          One structured flow.
        </h2>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STEPS.map((step, i) => (
            <WorkflowStep key={step.n} step={step} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowStep({ step, isLast }: { step: typeof STEPS[0]; isLast: boolean }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "40px 1fr 1fr",
      gap: "0 48px",
      alignItems: "start",
      paddingBottom: isLast ? 0 : 56,
      position: "relative",
    }}
    className="workflow-step">
      {/* Number + line column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--surface-dark)",
          border: "1px solid rgba(0,0,0,0.0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span className="text-mono-sm" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            {step.n}
          </span>
        </div>
        {!isLast && (
          <div style={{
            width: 1,
            flex: 1,
            minHeight: 40,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.04))",
            marginTop: 8,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingTop: 8 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-dark)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-dark-muted)", lineHeight: 1.65, maxWidth: 320 }}>
          {step.desc}
        </p>
      </div>

      {/* UI preview */}
      <div style={{ paddingTop: 4 }}>
        {step.ui}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .workflow-step {
            grid-template-columns: 32px 1fr !important;
          }
          .workflow-step > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Tiny UI previews for each step ─────────────────────────── */

function MiniCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 10,
      padding: "14px 16px",
      fontSize: 13,
      color: "var(--text-dark-2)",
    }}>
      {children}
    </div>
  );
}

function PoolCreateUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>New Pool</div>
      <div style={{ background: "#F5F4F2", borderRadius: 6, padding: "8px 10px", marginBottom: 8, fontSize: 13, color: "#0C0C0C", fontWeight: 500 }}>
        Highland Studio Session
      </div>
      <div style={{ background: "#F5F4F2", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#999" }}>
        Music production · 4 collaborators
      </div>
    </MiniCard>
  );
}

function CollaboratorsUI() {
  const members = [
    { initials: "PR", hue: 217 },
    { initials: "VO", hue: 150 },
    { initials: "SW", hue: 280 },
    { initials: "MX", hue: 45 },
  ];
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Collaborators</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {members.map(m => (
          <div key={m.initials} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `hsl(${m.hue}, 55%, 88%)`,
              border: `1px solid hsl(${m.hue}, 55%, 78%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: `hsl(${m.hue}, 60%, 35%)`,
              fontFamily: "var(--font-mono)",
            }}>{m.initials}</div>
            <div style={{ height: 8, background: "#EEE", borderRadius: 4, flex: 1 }} />
            <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}>Joined</span>
          </div>
        ))}
      </div>
    </MiniCard>
  );
}

function SplitUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Split configuration</div>
      {[
        { r: "Producer",    p: 40 },
        { r: "Vocalist",   p: 30 },
        { r: "Songwriter", p: 20 },
        { r: "Mixer",      p: 10 },
      ].map(row => (
        <div key={row.r} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#3A3A3A", flex: 1, fontWeight: 500 }}>{row.r}</span>
          <div style={{ flex: 2, height: 4, background: "#EEE", borderRadius: 2 }}>
            <div style={{ width: `${row.p}%`, height: "100%", background: "var(--surface-dark)", borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#0C0C0C", minWidth: 28, textAlign: "right" }}>
            {row.p}%
          </span>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 11, color: "#22C55E", fontWeight: 600 }}>Total: 100% ✓</div>
    </MiniCard>
  );
}

function PaymentLinkUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Payment link</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#F5F4F2", borderRadius: 6, padding: "8px 10px",
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M5 2.5H3a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1V7m-1-5h3m0 0v3m0-3L6 7" stroke="#999" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 11, color: "#666", fontFamily: "var(--font-mono)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          splitpay.app/pay/xk7m9q2
        </span>
        <span style={{ fontSize: 10, color: "var(--surface-dark)", background: "#D4FF4D", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>Copy</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#999" }}>Client pays without an account</div>
    </MiniCard>
  );
}

function VerifyUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Payment verification</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "Paystack callback", status: "✓", ok: true },
          { label: "Server verification", status: "✓", ok: true },
          { label: "Webhook processed", status: "✓", ok: true },
          { label: "Ledger updated", status: "✓", ok: true },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#3A3A3A" }}>{row.label}</span>
            <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>{row.status}</span>
          </div>
        ))}
      </div>
    </MiniCard>
  );
}

function AllocationsUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Allocations created</div>
      {[
        { r: "Producer",    a: "₦200,000" },
        { r: "Vocalist",   a: "₦150,000" },
        { r: "Songwriter", a: "₦100,000" },
        { r: "Mixer",      a: "₦50,000" },
      ].map(row => (
        <div key={row.r} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#3A3A3A", fontWeight: 500 }}>{row.r}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#0C0C0C" }}>{row.a}</span>
        </div>
      ))}
    </MiniCard>
  );
}

function WithdrawUI() {
  return (
    <MiniCard>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Available balance</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#0C0C0C", marginBottom: 12 }}>₦200,000</div>
      <button style={{
        width: "100%",
        height: 32,
        background: "var(--surface-dark)",
        color: "white",
        border: "none",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
      }}>
        Request withdrawal
      </button>
      <div style={{ marginTop: 8, fontSize: 10, color: "#22C55E" }}>
        ● PENDING · Your bank account
      </div>
    </MiniCard>
  );
}
