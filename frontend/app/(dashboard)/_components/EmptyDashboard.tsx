"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmptyDashboard() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const raw = joinCode.trim();
    if (!raw) {
      setJoinError("Please enter an invite code or link.");
      return;
    }
    setJoinError("");
    setJoining(true);

    let token = raw.replace(/\/+$/, "");
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] || raw;
      }
    } catch {
      // Treat as raw token
    }

    router.push(`/join/${token}`);
  }

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "48px 0 64px 0",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Header section */}
      <div style={{ maxWidth: 580 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 100,
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#16A34A",
          }} />
          <span style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: "#666",
            letterSpacing: "0.02em",
          }}>
            Splitpay Workspace
          </span>
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "#0A0A0A",
          lineHeight: 1.25,
          marginBottom: 12,
        }}>
          Welcome to Splitpay
        </h1>

        <p style={{
          fontSize: 14.5,
          color: "#666",
          lineHeight: 1.6,
        }}>
          Collaborate on client projects, collect payments with a single link, and automatically split funds among team members.
        </p>
      </div>

      {/* Two core paths */}
      <div
        className="sp-action-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <style>{`
          @media (max-width: 640px) {
            .sp-action-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Card 1: Create Pool */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            transition: "all 150ms ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#0A0A0A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>

            <div>
              <h2 style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#0A0A0A",
                marginBottom: 6,
                letterSpacing: "-0.015em",
              }}>
                Create a New Pool
              </h2>
              <p style={{
                fontSize: 13,
                color: "#777",
                lineHeight: 1.55,
              }}>
                Start a project workspace, invite your collaborators with their split percentages, and generate a client payment link.
              </p>
            </div>
          </div>

          <div>
            <Link
              href="/dashboard/pools/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 100,
                background: "#0A0A0A",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 140ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              Start a Pool
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Card 2: Join a Pool */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            transition: "all 150ms ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.07)",
              color: "#0A0A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <h2 style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#0A0A0A",
                  letterSpacing: "-0.015em",
                }}>
                  Join with Invite Code
                </h2>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#2563EB",
                  background: "rgba(37,99,235,0.08)",
                  padding: "2px 7px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}>
                  Invited
                </span>
              </div>
              <p style={{
                fontSize: 13,
                color: "#777",
                lineHeight: 1.55,
              }}>
                Enter the invite code or link provided by your team lead or collaborator to claim your split allocation.
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                setShowJoinInput(s => !s);
                setJoinCode("");
                setJoinError("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 100,
                background: "none",
                color: "#0A0A0A",
                border: "1px solid rgba(0,0,0,0.14)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 140ms ease, border-color 140ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "#0A0A0A";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.14)";
              }}
            >
              {showJoinInput ? "Close" : "Enter Invite Code"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={showJoinInput ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Join Form */}
      {showJoinInput && (
        <div
          style={{
            background: "#FAFAFA",
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 14,
            padding: "20px 24px",
            animation: "fadeSlide 160ms ease-out",
          }}
        >
          <style>{`
            @keyframes fadeSlide {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 4 }}>
            Join a Pool
          </p>
          <p style={{ fontSize: 12.5, color: "#777", marginBottom: 14 }}>
            Paste the invite link or 3-character code you received from your collaborator.
          </p>

          <form onSubmit={handleJoin} noValidate style={{ display: "flex", gap: 8, alignItems: "stretch", flexWrap: "wrap" }}>
            <input
              type="text"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
              placeholder="e.g. hsy  or  splitpay.com/join/hsy"
              autoFocus
              style={{
                flex: "1 1 260px",
                padding: "10px 14px",
                borderRadius: 9,
                border: `1px solid ${joinError ? "#DC2626" : "rgba(0,0,0,0.14)"}`,
                background: "#FFFFFF",
                fontSize: 13.5,
                color: "#0A0A0A",
                outline: "none",
                fontFamily: "var(--font-mono)",
                transition: "border-color 140ms ease",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#0A0A0A"; }}
              onBlur={e => { e.currentTarget.style.borderColor = joinError ? "#DC2626" : "rgba(0,0,0,0.14)"; }}
            />
            <button
              type="submit"
              disabled={joining}
              style={{
                padding: "10px 20px",
                borderRadius: 9,
                background: "#0A0A0A",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: joining ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "background 140ms ease",
              }}
              onMouseEnter={e => { if (!joining) (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { if (!joining) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              {joining ? "Joining…" : "Continue →"}
            </button>
            <button
              type="button"
              onClick={() => { setShowJoinInput(false); setJoinCode(""); setJoinError(""); }}
              style={{
                padding: "10px 14px",
                borderRadius: 9,
                background: "none",
                border: "1px solid rgba(0,0,0,0.10)",
                color: "#777",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </form>

          {joinError && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{joinError}</p>
          )}
        </div>
      )}

      {/* How Splitpay Works - Senior Architecture Breakdown */}
      <div style={{
        paddingTop: 16,
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#999",
          marginBottom: 20,
        }}>
          How Splitpay Works
        </p>

        <div
          className="sp-steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          <style>{`
            @media (max-width: 640px) {
              .sp-steps-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {[
            {
              step: "01",
              title: "Create a Pool",
              desc: "Create a project workspace, set the currency, and define the team roles.",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Invite & Share Link",
              desc: "Invite collaborators with assigned split shares and share a payment link with your client.",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Automatic Distribution",
              desc: "When the client pays, funds are credited and each member can withdraw their share.",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              ),
            },
          ].map(({ step, title, desc, icon }) => (
            <div
              key={step}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "rgba(0,0,0,0.04)",
                  color: "#0A0A0A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {icon}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "#aaa",
                }}>
                  {step}
                </span>
              </div>

              <div>
                <p style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "#0A0A0A",
                  marginBottom: 4,
                }}>
                  {title}
                </p>
                <p style={{
                  fontSize: 12.5,
                  color: "#777",
                  lineHeight: 1.55,
                }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
