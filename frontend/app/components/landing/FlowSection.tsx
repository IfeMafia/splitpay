"use client";

export default function FlowSection() {
  const steps = [
    {
      n: "01",
      title: "Create a Pool",
      desc: "Name your project. A Pool is the shared workspace for a collaborative payment — where splits, members, and records live.",
    },
    {
      n: "02",
      title: "Set your split",
      desc: "Agree on percentages together. Equal or custom — the team decides. Total must reach 100%. No spreadsheets.",
    },
    {
      n: "03",
      title: "Share one link",
      desc: "Your client pays a single Splitpay link. No accounts needed. Splitpay verifies the payment server-side.",
    },
    {
      n: "04",
      title: "Everyone gets paid",
      desc: "Once verified, each collaborator's allocation is instantly created. They withdraw to their own account, independently.",
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-label="How Splitpay works"
      style={{ background: "#F9F9F9", padding: "clamp(80px,11vw,140px) 0" }}
    >
      <div className="container">

        {/* Header — left-aligned, editorial */}
        <div style={{ marginBottom: 72 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#bbb", marginBottom: 20,
          }}>
            · How it works
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "clamp(24px,4vw,64px)", alignItems: "end",
          }} className="flow-header">
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
              color: "#0A0A0A",
            }}>
              From agreement{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#aaa" }}>
                to payout
              </span>
              {" "}in four steps.
            </h2>
            <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, maxWidth: 380 }}>
              No spreadsheets. No manual transfers. No chasing anyone. One payment in — everyone paid out, automatically.
            </p>
          </div>
        </div>

        {/* Step cards — horizontal timeline feel */}
        <div className="flow-steps" style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          position: "relative",
        }}>
          {/* Connector line behind cards */}
          <div aria-hidden="true" style={{
            position: "absolute",
            top: 32, left: "12.5%", right: "12.5%",
            height: 1,
            background: "linear-gradient(to right, transparent, #DCDCDC 15%, #DCDCDC 85%, transparent)",
            zIndex: 0,
          }} className="flow-connector" />

          {steps.map((step, i) => (
            <div key={step.n} style={{
              background: "#fff",
              border: "1px solid #EBEBEB",
              borderRadius: 20,
              padding: "28px 24px",
              position: "relative",
              zIndex: 1,
              transition: "box-shadow 200ms, transform 200ms",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {/* Step number circle */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: i === steps.length - 1 ? "#0A0A0A" : "#fff",
                border: `1px solid ${i === steps.length - 1 ? "#0A0A0A" : "#DCDCDC"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: i === steps.length - 1 ? "#fff" : "#888",
                fontFamily: "var(--font-mono)",
                marginBottom: 20,
              }}>
                {step.n}
              </div>
              <h3 style={{
                fontSize: 15, fontWeight: 600,
                color: "#0A0A0A", marginBottom: 10, letterSpacing: "-0.01em",
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.65, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .flow-steps { grid-template-columns: 1fr 1fr !important; }
          .flow-connector { display: none !important; }
          .flow-header { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .flow-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
