"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated } from "../../lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/* ─── Types ───────────────────────────────────── */

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

/* ─── Page ────────────────────────────────────── */

export default function InvitationPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();

  const [state, setState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const isAuth = isAuthenticated();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BASE_URL}/invitations/${token}`);
        if (res.status === 404) { setState("not_found"); return; }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `Error ${res.status}`);
        }
        const json = await res.json();
        setInvitation(json.data);
        setState("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load invitation.");
        setState("error");
      }
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuth) {
      // Typically, they'd login/signup then redirect back here.
      router.push(`/login?redirect=/invitations/${token}`);
      return;
    }
    
    setState("accepting");
    try {
      const res = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status}`);
      }
      setState("success");
      setTimeout(() => {
        router.push("/dashboard/pools");
      }, 2000);
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
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65 }}>
            This invitation doesn&apos;t exist or has already been accepted. Check the URL and try again.
          </p>
        </div>
      </Shell>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <Shell>
        <div style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
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
        <div style={{ maxWidth: 440 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(22,163,74,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.25 }}>
            Invitation Accepted
          </h1>
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 28 }}>
            You are now a collaborator on {invitation?.projectName}. Redirecting to your pools...
          </p>
        </div>
      </Shell>
    );
  }

  /* ── Ready to Accept ── */
  if (!invitation) return null;

  return (
    <Shell>
      <div style={{ maxWidth: 440, width: "100%" }}>
        {/* Brand */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A", letterSpacing: "-0.01em" }}>Splitpay</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.25 }}>
          Join {invitation.projectName}
        </h1>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 28 }}>
          {invitation.inviterName} ({invitation.inviterEmail}) has invited you to collaborate.
        </p>

        {/* Details card */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFA",
          marginBottom: 28, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <SummaryRow label="Role"><span style={{ textTransform: "capitalize" }}>{invitation.role.toLowerCase()}</span></SummaryRow>
          <SummaryRow label="Split">
            <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500 }}>
              {invitation.splitPercentage}%
            </span>
          </SummaryRow>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleAccept}
            disabled={state === "accepting"}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 12,
              background: state === "accepting" ? "rgba(0,0,0,0.06)" : "#0A0A0A", 
              color: state === "accepting" ? "#aaa" : "#fff", border: "none",
              fontSize: 15, fontWeight: 500, cursor: state === "accepting" ? "not-allowed" : "pointer",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {state === "accepting" ? "Accepting..." : (isAuth ? "Accept Invitation" : "Sign in to Accept")}
          </button>
        </div>
        
        {!isAuth && (
          <p style={{ marginTop: 24, fontSize: 13, color: "#888", textAlign: "center" }}>
            Don't have an account? <Link href={`/signup?redirect=/invitations/${token}`} style={{ color: "#0A0A0A", textDecoration: "none" }}>Sign up</Link>
          </p>
        )}
      </div>
    </Shell>
  );
}

/* ─── Shell ───────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F9F9F9",
      display: "flex", flexDirection: "column",
    }}>
      {/* Minimal top nav */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#0A0A0A", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Splitpay
        </Link>
        <span style={{ fontSize: 11.5, color: "#bbb" }}>Invitation</span>
      </div>

      {/* Content area */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────── */

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#bbb" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#555" }}>{children}</span>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "sp-pulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes sp-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}
