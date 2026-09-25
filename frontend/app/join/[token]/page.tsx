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
      await api.post(`/invitations/${token}/accept`, {});
      setState("success");
      setTimeout(() => {
        router.push("/dashboard/pools");
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to accept invitation.");
      setState("error");
    }
  };

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
          <Bone width={100} height={9} />
          <Bone width={260} height={22} />
          <Bone width={180} height={12} />
          <div style={{ marginTop: 8 }}>
            <Bone width="100%" height={56} radius="12px" />
          </div>
          <Bone width="100%" height={40} radius="100px" />
        </div>
      </Shell>
    );
  }

  /* ── Not found ── */
  if (state === "not_found") {
    return (
      <Shell>
        <div style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Invitation not found
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>
            This invitation link or code is invalid, expired, or has already been accepted.
          </p>
          <Link href="/dashboard" style={primaryBtnStyle}>
            Go to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <Shell>
        <div style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.6, marginBottom: 28 }}>
            {errorMsg}
          </p>
          <button onClick={() => window.location.reload()} style={primaryBtnStyle}>
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  /* ── Success ── */
  if (state === "success") {
    return (
      <Shell>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(22,163,74,0.08)", color: "#16A34A",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px auto"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.025em" }}>
            You joined {invitation?.projectName}!
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>
            Redirecting to your dashboard...
          </p>
        </div>
      </Shell>
    );
  }

  if (!invitation) return null;

  return (
    <Shell>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>
          You&apos;re invited to join
        </p>

        <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 500, letterSpacing: "-0.03em", color: "#0A0A0A", lineHeight: 1.2, marginBottom: 8 }}>
          {invitation.projectName}
        </h1>

        <p style={{ fontSize: 13.5, color: "#666", lineHeight: 1.6, marginBottom: 28 }}>
          {invitation.inviterName} ({invitation.inviterEmail}) has invited you to collaborate on this Pool.
        </p>

        {/* Card details */}
        <div style={{
          padding: 20, borderRadius: 16,
          background: "#F9F9FB", border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 28, display: "flex", flexDirection: "column", gap: 14
        }}>
          <Row label="Role" value={invitation.role} />
          <Row label="Invited email" value={invitation.invitedEmail ?? "Anyone with code"} />
          <Row label="Code" value={token.toUpperCase()} mono />
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleAccept}
            disabled={state === "accepting"}
            style={primaryBtnStyle}
          >
            {state === "accepting" ? "Joining Pool..." : isAuth ? "Accept invitation" : "Sign in to accept"}
          </button>

          {!isAuth && (
            <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link href={`/signup?redirect=/join/${token}`} style={{ color: "#0A0A0A", fontWeight: 500 }}>
                Sign up
              </Link>
            </p>
          )}
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
      background: "#FAFAFC"
    }}>
      <div style={{ marginBottom: 40 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.04em", color: "#0A0A0A" }}>
            Splitpay<span style={{ color: "#2563EB" }}>.</span>
          </span>
        </Link>
      </div>

      <div style={{
        width: "100%", maxWidth: 480, background: "#FFFFFF",
        borderRadius: 24, padding: "36px 32px",
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)"
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
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
      backgroundSize: "200% 100%", animation: "pulse 1.5s infinite"
    }} />
  );
}

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 24px",
  borderRadius: 100,
  background: "#0A0A0A",
  color: "#FFFFFF",
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(10,10,10,0.15)",
  transition: "transform 140ms, background 140ms",
};
