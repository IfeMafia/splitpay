"use client";

const cases = [
  {
    category: "Music",
    label: "Studio Sessions & Royalties",
    desc: "Producers, vocalists, songwriters, and mixers — one payment in, four instant allocations out. No chasing, no drama.",
    roles: ["Producer", "Vocalist", "Songwriter", "Mixer"],
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop",
    stat: "₦200K",
    statLabel: "avg per session",
  },
  {
    category: "Film & Video",
    label: "Creative Productions",
    desc: "Writers, directors, editors — everyone's share is agreed upfront and paid automatically the moment the client pays.",
    roles: ["Writer", "Director", "Editor", "Videographer"],
    img: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop",
    stat: "4×",
    statLabel: "faster than manual",
  },
  {
    category: "Design & Dev",
    label: "Agency & Freelance",
    desc: "One project, agreed shares. Designers, developers, and copywriters get their cut automatically — no awkward conversations.",
    roles: ["Designer", "Developer", "Copywriter"],
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
    stat: "100%",
    statLabel: "transparent",
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" style={{ background: "#F9F9F9", padding: "clamp(80px,11vw,140px) 0" }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#aaa", marginBottom: 20,
          }}>
            · Use cases
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", gap: 24, flexWrap: "wrap",
          }}>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
              color: "#0A0A0A", maxWidth: 480,
            }}>
              Built for the way{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#999" }}>
                collaborative
              </span>{" "}
              work actually happens.
            </h2>
            <p style={{ fontSize: 15, color: "#999", lineHeight: 1.7, maxWidth: 320 }}>
              No fake customer logos. Straightforward tools that ensure everyone gets their agreed share.
            </p>
          </div>
        </div>

        {/* Cards — light background, editorial, no dark grid */}
        <div className="uc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {cases.map((c, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #EBEBEB",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              transition: "box-shadow 200ms, transform 200ms",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {/* Image — clean, not darkened heavily */}
              <div style={{
                width: "100%", height: 180,
                position: "relative", overflow: "hidden", flexShrink: 0,
              }}>
                <img
                  src={c.img}
                  alt={c.category}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Stat pill floating over image */}
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  borderRadius: 12, padding: "8px 14px", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1 }}>{c.stat}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{c.statLabel}</div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "24px 24px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#bbb", marginBottom: 10,
                }}>
                  {c.category}
                </div>
                <h3 style={{
                  fontSize: 17, fontWeight: 600, color: "#0A0A0A",
                  letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.3,
                }}>
                  {c.label}
                </h3>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.65, marginBottom: 20, flex: 1 }}>
                  {c.desc}
                </p>

                {/* Roles as light tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {c.roles.map(role => (
                    <span key={role} style={{
                      display: "inline-block",
                      background: "#F5F5F5", border: "1px solid #E8E8E8",
                      borderRadius: 100, padding: "4px 12px",
                      fontSize: 11, fontWeight: 500, color: "#666",
                    }}>
                      {role}
                    </span>
                  ))}
                </div>

                <div style={{
                  borderTop: "1px solid #F0F0F0", paddingTop: 16,
                  fontSize: 12, fontWeight: 600, color: "#0A0A0A",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  One payment → everyone paid
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) { .uc-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .uc-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
