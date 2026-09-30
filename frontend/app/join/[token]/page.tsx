"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../lib/auth";
import { api, ApiError } from "../../lib/api";

interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedEmail: string | null;
  role: string;
  splitPercentage: number;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
  isAlreadyAccepted?: boolean;
}

interface Props {
  params: Promise<{ token: string }>;
}

type PageState = "loading" | "ready" | "not_found" | "error" | "accepting" | "success";

export default function JoinPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();

  const [state, setState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const isAuth = isAuthenticated();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Invitation>(`/invitations/${token}`);
        setInvitation(data);
        setState("ready");
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 410)) {
          setState("not_found");
        } else {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load invitation.");
          setState("error");
        }
      }
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuth) {
      router.push(`/login?redirect=/join/${token}`);
      return;
    }

    setState("accepting");
    try {
      const res: any = await api.post(`/invitations/${token}/accept`, {});
      setState("success");
      const targetPoolId = res?.poolId || invitation?.projectId;
      setTimeout(() => {
        router.push(targetPoolId ? `/dashboard/pools/${targetPoolId}` : "/dashboard/pools");
      }, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to accept invitation.");
      setState("error");
    }
  };

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Bone width={120} height={10} />
          <Bone width="80%" height={24} />
          <Bone width="60%" height={14} />
          <div style={{ marginTop: 12 }}>
            <Bone width="100%" height={100} radius="14px" />
          </div>
          <Bone width="100%" height={44} radius="100px" />
        </div>
      </Shell>
    );
  }

  /* ── Already Joined / Accepted ── */
  if (invitation?.isAlreadyAccepted) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(37,99,235,0.08)", color: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px auto"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Workspace Already Joined
          </h1>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px auto" }}>
            You or a collaborator has already accepted this invitation to <strong>{invitation.projectName}</strong>.
          </p>
          <Link href={`/dashboard/pools/${invitation.projectId}`} style={primaryBtnStyle}>
            Open Workspace →
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Not found ── */
  if (state === "not_found") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(0,0,0,0.04)", color: "#888",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px auto"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Invitation Expired or Invalid
          </h1>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px auto" }}>
            This invitation code or link has expired, been revoked, or is invalid.
          </p>
          <Link href="/dashboard" style={primaryBtnStyle}>
            Go to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(220,38,38,0.08)", color: "#DC2626",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px auto"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Unable to Process Invitation
          </h1>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6, marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button onClick={() => window.location.reload()} style={primaryBtnStyle}>
            Try Again
          </button>
        </div>
      </Shell>
    );
  }

  /* ── Success ── */
  if (state === "success") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(22,163,74,0.08)", color: "#16A34A",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px auto"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.025em" }}>
            Welcome to {invitation?.projectName}!
          </h1>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.6, marginBottom: 20 }}>
            You have joined the Pool as a collaborator. Opening workspace...
          </p>
        </div>
      </Shell>
    );
  }

  if (!invitation) return null;

  return (
    <Shell>
      <div style={{ width: "100%" }}>

        {/* Verified Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 100,
          background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.12)",
          marginBottom: 18,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#2563EB", letterSpacing: "0.02em" }}>
            Verified Workspace Invitation
          </span>
        </div>

        {/* Project & Inviter header */}
        <h1 style={{
          fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em",
          color: "#0A0A0A", lineHeight: 1.25, marginBottom: 10,
        }}>
          Join {invitation.projectName}
        </h1>

        <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
          <strong>{invitation.inviterName}</strong> ({invitation.inviterEmail}) has invited you to join this collaborative payment workspace on SplitPay.
        </p>

        {/* Agreed Split Percentage — hero card */}
        {invitation.splitPercentage > 0 && (
          <div style={{
            padding: "18px 20px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%)",
            border: "1px solid rgba(37,99,235,0.18)",
            marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Your Agreed Split Share
              </p>
              <p style={{ fontSize: 11, color: "#555", lineHeight: 1.5, maxWidth: 240 }}>
                This is the exact percentage the pool owner has allocated to you. It will be locked in when you accept.
              </p>
            </div>
            <div style={{
              fontSize: 30, fontWeight: 700, color: "#2563EB",
              fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", flexShrink: 0,
            }}>
              {invitation.splitPercentage}%
            </div>
          </div>
        )}

        {/* Invitation metadata card */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.07)",
          marginBottom: 24, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <Row label="Role Assigned" value={invitation.role || "Collaborator"} />
          <Row label="Recipient" value={invitation.invitedEmail ?? "Anyone with invitation link"} />
          <Row label="Invite Code" value={token.toUpperCase()} mono />
          {invitation.splitPercentage > 0 && (
            <Row label="Split Percentage" value={`${invitation.splitPercentage}% of net distributable`} />
          )}
        </div>

        {/* Guarantees & Transparency */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "14px 16px", borderRadius: 10,
          background: "rgba(0,0,0,0.02)", marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 12, color: "#555" }}>
              Your split share is pre-agreed and will be locked in automatically when you join.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 12, color: "#555" }}>
              Direct bank account withdrawal for your allocated share.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 12, color: "#555" }}>
              Automated financial distribution upon client payment completion.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleAccept}
            disabled={state === "accepting"}
            style={primaryBtnStyle}
          >
            {state === "accepting" ? "Accepting Invitation…" : isAuth ? "Accept Invitation & Enter Pool" : "Sign In to Accept"}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            {!isAuth ? (
              <span style={{ fontSize: 12, color: "#888" }}>
                New to SplitPay?{" "}
                <Link href={`/signup?redirect=/join/${token}`} style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>
                  Create an account
                </Link>
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "#888" }}>
                Logged in as verified user
              </span>
            )}

            <Link href="/dashboard" style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
              Decline / Not now
            </Link>
          </div>
        </div>

      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: "#FAFAFC",
    }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.04em", color: "#0A0A0A" }}>
            Splitpay<span style={{ color: "#2563EB" }}>.</span>
          </span>
        </Link>
      </div>

      <div style={{
        width: "100%", maxWidth: 480, background: "#FFFFFF",
        borderRadius: 20, padding: "36px 32px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.06)",
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: "#888" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: string | number; height: number; radius?: string }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, #F0F0F2 25%, #E5E5E8 50%, #F0F0F2 75%)",
      backgroundSize: "200% 100%", animation: "pulse 1.5s infinite",
    }} />
  );
}

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 24px",
  borderRadius: 100,
  background: "#0A0A0A",
  color: "#FFFFFF",
  border: "none",
  fontSize: 13.5,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  transition: "background 140ms ease",
};
