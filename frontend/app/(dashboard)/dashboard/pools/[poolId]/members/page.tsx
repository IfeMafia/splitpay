"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../../lib/api";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatDate, formatRelativeTime, formatPercent, shortId } from "../../../../../lib/format";
import { toast } from "@/app/components/Toast";
import { getUser } from "@/app/lib/auth";
import ConfirmModal from "@/app/components/ui/ConfirmModal";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  ownerId: string;
  currency: string;
  totalAmount: number;
}

interface Collaborator {
  id: string;
  projectId: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  splitPercentage: number | string;
  status: string;
  createdAt: string;
}

interface Props {
  params: Promise<{ poolId: string }>;
}

type PageState = "loading" | "ready" | "error";
type InviteState = "idle" | "submitting" | "success" | "error";
type CodeInviteState = "idle" | "generating" | "success" | "error";

interface FormErrors {
  email?: string;
  role?: string;
  splitPercentage?: string;
}

interface InviteCode {
  code: string;
  expiresAt?: string;
}

/* ─── Page ────────────────────────────────────── */

export default function MembersPage({ params }: Props) {
  const { poolId } = use(params);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [pool, setPool] = useState<Pool | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Collaborator");
  const [splitPct, setSplitPct] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [inviteState, setInviteState] = useState<InviteState>("idle");
  const [inviteError, setInviteError] = useState("");

  // Invite code state
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [codeInviteState, setCodeInviteState] = useState<CodeInviteState>("idle");
  const [codeInviteError, setCodeInviteError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCodeSection, setShowCodeSection] = useState(false);

  // Remove state
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const currentUser = getUser();
  const isOwner = Boolean(pool && currentUser && currentUser.id === pool.ownerId);

  useEffect(() => {
    load();
  }, [poolId]);

  async function load() {
    setPageState("loading");
    try {
      const [poolData, collabData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<Collaborator[]>(`/collaborators/project/${poolId}`).catch(() => [] as Collaborator[]),
      ]);
      setPool(poolData);
      const list = Array.isArray(collabData) ? collabData : [];
      setCollaborators(list);

      // Check if there is an active invite code in the collaborators list
      const codeItem = list.find((c: any) => c.status === "INVITED" && !c.invitedEmail);
      if (codeItem) {
        setInviteCode({ code: (codeItem as any).code || codeItem.id });
      }

      setPageState("ready");
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load.");
      setPageState("error");
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (!role.trim()) errs.role = "Role is required.";
    if (!splitPct) errs.splitPercentage = "Split percentage is required.";
    else {
      const n = Number(splitPct);
      if (isNaN(n) || n <= 0 || n > 100) errs.splitPercentage = "Enter a value between 0.01 and 100.";
    }
    return errs;
  }

  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  const liveErrors = Object.keys(touched).length > 0 ? validate() : {};

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = { email: true, role: true, splitPercentage: true };
    setTouched(allTouched);
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setInviteState("submitting");
    setInviteError("");

    try {
      const newCollab = await api.post<Collaborator>("/collaborators", {
        projectId: poolId,
        invitedEmail: email.trim(),
        role: role.trim(),
        splitPercentage: Number(splitPct),
      });
      setCollaborators(prev => [...prev, newCollab]);
      setInviteState("success");
      setTimeout(() => {
        setEmail(""); setRole("Collaborator"); setSplitPct("");
        setTouched({}); setFormErrors({});
        setInviteState("idle"); setShowForm(false);
        load();
      }, 1200);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation.");
      setInviteState("error");
    }
  }

  function handleRemovePrompt(id: string, nameOrEmail: string) {
    setModalConfig({
      isOpen: true,
      title: "Remove Collaborator",
      message: `Are you sure you want to remove ${nameOrEmail} from this Pool?`,
      confirmText: "Remove",
      isDestructive: true,
      onConfirm: async () => {
        setRemovingId(id);
        try {
          await api.delete<void>(`/collaborators/${id}`);
          setCollaborators(prev => prev.filter(c => c.id !== id));
          toast.success("Collaborator removed.");
        } catch (err) {
          toast.error(err, "Failed to remove collaborator.");
        } finally {
          setRemovingId(null);
          setModalConfig(m => ({ ...m, isOpen: false }));
        }
      },
    });
  }

  function handleLeavePoolPrompt() {
    setModalConfig({
      isOpen: true,
      title: "Leave Pool",
      message: `Are you sure you want to leave "${pool?.name}"? You will lose access to its splits and allocations.`,
      confirmText: "Leave Pool",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.post(`/collaborators/leave/${poolId}`, {});
          toast.success("You left the pool.");
          window.location.href = "/dashboard/pools";
        } catch (err) {
          toast.error(err, "Failed to leave pool.");
          setModalConfig(m => ({ ...m, isOpen: false }));
        }
      },
    });
  }

  function handleNullifyCodePrompt() {
    if (!inviteCode) return;
    setModalConfig({
      isOpen: true,
      title: "Nullify Invite Code",
      message: `Are you sure you want to nullify/revoke code "${inviteCode.code.toUpperCase()}"? Anyone attempting to join using this code or link will be blocked.`,
      confirmText: "Nullify Code",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/collaborators/${inviteCode.code}`);
          toast.success("Invite code nullified.");
          setInviteCode(null);
          setShowCodeSection(false);
          load();
        } catch (err) {
          toast.error(err, "Failed to nullify invite code.");
        } finally {
          setModalConfig(m => ({ ...m, isOpen: false }));
        }
      },
    });
  }

  async function handleGenerateCode() {
    setCodeInviteState("generating");
    setCodeInviteError("");
    try {
      const result = await api.post<Collaborator & { code?: string }>("/collaborators", {
        projectId: poolId,
        role: "Collaborator",
        splitPercentage: 0,
      });
      setInviteCode({ code: result.code || result.id });
      setCodeInviteState("success");
      setShowCodeSection(true);
    } catch (err) {
      setCodeInviteError(err instanceof Error ? err.message : "Failed to generate invite code.");
      setCodeInviteState("error");
    }
  }

  const [linkCopied, setLinkCopied] = useState(false);

  async function handleCopyOnlyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode.code);
    setCodeCopied(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleCopyLink() {
    if (!inviteCode) return;
    const inviteLink = `${window.location.origin}/join/${inviteCode.code}`;
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const totalSplit = collaborators.reduce((s, c) => s + Number(c.splitPercentage), 0);
  const isSubmitting = inviteState === "submitting";

  if (pageState === "loading") return <PageSkeleton />;
  if (pageState === "error") return <PageError message={errorMsg} status={errorStatus} poolId={poolId} />;
  if (!pool) return null;

  return (
    <div style={{ maxWidth: 760 }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28 }}>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <Chevron />
        <BreadLink href="/dashboard/pools">Pools</BreadLink>
        <Chevron />
        <BreadLink href={`/dashboard/pools/${poolId}`}>{pool.name}</BreadLink>
        <Chevron />
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>Collaborators</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            {pool.name}
          </p>
          <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            Collaborators
          </h1>
        </div>
        {!showForm && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isOwner ? (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 100,
                    background: "#0A0A0A", color: "#fff", border: "none",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    transition: "background 140ms", flexShrink: 0,
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Invite by email
                </button>
                <button
                  onClick={() => {
                    if (!inviteCode) {
                      handleGenerateCode();
                    } else {
                      setShowCodeSection(s => !s);
                    }
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 100,
                    background: "none", color: "#555", border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    transition: "background 140ms, border-color 140ms", flexShrink: 0,
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Invite code
                </button>
              </>
            ) : (
              <button
                onClick={handleLeavePoolPrompt}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 18px", borderRadius: 100,
                  background: "rgba(220,38,38,0.08)", color: "#DC2626",
                  border: "1px solid rgba(220,38,38,0.2)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "background 140ms", flexShrink: 0,
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.08)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Leave Pool
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Invite code section ── */}
      {showCodeSection && !showForm && (
        <div style={{
          marginBottom: 24, padding: "20px 22px", borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.10)", background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginBottom: 3 }}>Invite by code</p>
              <p style={{ fontSize: 12.5, color: "#999" }}>
                Generate a shareable link. Anyone with the link can join this Pool.
              </p>
            </div>
            <button
              onClick={() => { setShowCodeSection(false); setInviteCode(null); setCodeInviteState("idle"); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 4, flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {codeInviteState === "error" && codeInviteError && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 9,
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
            }}>
              <p style={{ fontSize: 12.5, color: "#991B1B" }}>{codeInviteError}</p>
            </div>
          )}

          {inviteCode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Prominent Invite Code */}
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Invite Code
                </p>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "12px 16px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)", background: "#F4F4F5",
                }}>
                  <span style={{
                    fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#0A0A0A",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>
                    {inviteCode.code}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleCopyOnlyCode}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 8, flexShrink: 0,
                        background: codeCopied ? "rgba(22,163,74,0.1)" : "#0A0A0A",
                        color: codeCopied ? "#16A34A" : "#fff",
                        border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer",
                        transition: "all 180ms", fontFamily: "inherit",
                      }}
                    >
                      {codeCopied ? (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Code Copied</>
                      ) : (
                        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Code</>
                      )}
                    </button>
                    {isOwner && (
                      <button
                        onClick={handleNullifyCodePrompt}
                        style={{
                          padding: "8px 12px", borderRadius: 8,
                          border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.06)",
                          color: "#DC2626", fontSize: 12, fontWeight: 500, cursor: "pointer",
                          fontFamily: "inherit", transition: "background 140ms",
                        }}
                      >
                        Nullify Code
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Link Reference */}
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 500, color: "#888", marginBottom: 6 }}>Join Link</p>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFA",
                }}>
                  <span style={{
                    flex: 1, fontSize: 12, fontFamily: "var(--font-mono)", color: "#666",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {typeof window !== "undefined" ? `${window.location.origin}/join/${inviteCode.code}` : `/join/${inviteCode.code}`}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 10px", borderRadius: 6, flexShrink: 0,
                      background: linkCopied ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.06)",
                      color: linkCopied ? "#16A34A" : "#555",
                      border: "none", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {linkCopied ? "Link Copied" : "Copy Link"}
                  </button>
                </div>
              </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <p style={{ fontSize: 11.5, color: "#999", margin: 0 }}>Code & link expire in 7 days.</p>
                <button
                  onClick={handleGenerateCode}
                  disabled={codeInviteState === "generating"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 7,
                    background: "none", border: "1px solid rgba(0,0,0,0.12)",
                    color: "#666", fontSize: 12, cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Generate new code
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={codeInviteState === "generating"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 100,
                background: codeInviteState === "generating" ? "#555" : "#0A0A0A",
                color: "#fff", border: "none",
                fontSize: 13, fontWeight: 500,
                cursor: codeInviteState === "generating" ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {codeInviteState === "generating" ? <><Spinner /> Generating…</> : "Generate invite code"}
            </button>
          )}
        </div>
      )}

      {/* ── Invite form ── */}
      {showForm && (
        <div style={{
          marginBottom: 28, padding: "22px 24px", borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>Invite a collaborator</p>
              <p style={{ fontSize: 12.5, color: "#999", marginTop: 3 }}>
                They&apos;ll receive an invitation to join this Pool.
              </p>
            </div>
            <button
              onClick={() => { setShowForm(false); setInviteState("idle"); setInviteError(""); setTouched({}); setFormErrors({}); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Server error */}
          {inviteState === "error" && inviteError && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 9,
              padding: "11px 14px", borderRadius: 8, marginBottom: 16,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: 12.5, color: "#991B1B" }}>{inviteError}</p>
            </div>
          )}

          {/* Success */}
          {inviteState === "success" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "11px 14px", borderRadius: 8, marginBottom: 16,
              background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ fontSize: 12.5, color: "#166534" }}>Invitation sent successfully.</p>
            </div>
          )}

          <form onSubmit={handleInvite} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Email */}
            <Field label="Email address" error={liveErrors.email ?? formErrors.email}>
              <input
                type="email"
                id="invite-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                placeholder="collaborator@example.com"
                disabled={isSubmitting || inviteState === "success"}
                autoFocus
                style={inputStyle(!!(liveErrors.email ?? formErrors.email))}
                onFocus={e => focusRing(e, !!(liveErrors.email ?? formErrors.email))}
                onBlurCapture={e => blurRing(e, !!(liveErrors.email ?? formErrors.email))}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
              {/* Role */}
              <Field label="Role" error={liveErrors.role ?? formErrors.role}>
                <input
                  type="text"
                  id="invite-role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  onBlur={() => touch("role")}
                  placeholder="e.g. Designer, Developer"
                  disabled={isSubmitting || inviteState === "success"}
                  style={inputStyle(!!(liveErrors.role ?? formErrors.role))}
                  onFocus={e => focusRing(e, !!(liveErrors.role ?? formErrors.role))}
                  onBlurCapture={e => blurRing(e, !!(liveErrors.role ?? formErrors.role))}
                />
              </Field>

              {/* Split % */}
              <Field label="Split %" error={liveErrors.splitPercentage ?? formErrors.splitPercentage}>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    id="invite-split"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={splitPct}
                    onChange={e => setSplitPct(e.target.value)}
                    onBlur={() => touch("splitPercentage")}
                    placeholder="0.00"
                    disabled={isSubmitting || inviteState === "success"}
                    style={{ ...inputStyle(!!(liveErrors.splitPercentage ?? formErrors.splitPercentage)), paddingRight: 30, fontFamily: "var(--font-mono)" }}
                    onFocus={e => focusRing(e, !!(liveErrors.splitPercentage ?? formErrors.splitPercentage))}
                    onBlurCapture={e => blurRing(e, !!(liveErrors.splitPercentage ?? formErrors.splitPercentage))}
                  />
                  <span style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, color: "#bbb", pointerEvents: "none",
                  }}>%</span>
                </div>
              </Field>
            </div>

            {/* Allocation hint */}
            {collaborators.length > 0 && (
              <p style={{ fontSize: 11.5, color: "#bbb" }}>
                Currently allocated: <span style={{ fontFamily: "var(--font-mono)", color: totalSplit > 100 ? "#DC2626" : "#888" }}>
                  {formatPercent(totalSplit)}
                </span> of 100%
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={isSubmitting || inviteState === "success"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 22px", borderRadius: 100,
                  background: isSubmitting ? "#555" : "#0A0A0A",
                  color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "background 140ms",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#222"; }}
                onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
              >
                {isSubmitting ? (
                  <><Spinner /> Sending…</>
                ) : inviteState === "success" ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Sent
                  </>
                ) : "Send invitation"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setInviteState("idle"); setInviteError(""); setTouched({}); setFormErrors({}); }}
                style={{
                  padding: "10px 16px", borderRadius: 100,
                  background: "none", border: "none", color: "#888",
                  fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Members list ── */}
      {collaborators.length === 0 && !showForm ? (
        /* Empty state */
        <div style={{ paddingTop: 44 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            No collaborators yet
          </p>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24, maxWidth: 380 }}>
            Invite the people who&apos;ll receive a share of this payment. Each collaborator gets their own percentage of the total.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", borderRadius: 100,
              background: "#0A0A0A", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite collaborator
          </button>
        </div>
      ) : collaborators.length > 0 && (
        <div>
          {/* Allocation summary bar */}
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb" }}>
              {collaborators.length} {collaborators.length === 1 ? "member" : "members"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 80, height: 3, borderRadius: 100, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(totalSplit, 100)}%`,
                  borderRadius: 100,
                  background: totalSplit > 100 ? "#DC2626" : totalSplit === 100 ? "#16A34A" : "#0A0A0A",
                  transition: "width 300ms ease",
                }} />
              </div>
              <span style={{
                fontSize: 11.5, fontFamily: "var(--font-mono)", fontWeight: 500,
                color: totalSplit > 100 ? "#DC2626" : totalSplit === 100 ? "#16A34A" : "#888",
              }}>
                {formatPercent(totalSplit)}{totalSplit > 100 ? " — exceeds limit" : totalSplit === 100 ? " allocated" : " of 100%"}
              </span>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, background: "#fff", overflow: "hidden" }}>
            {collaborators.map((c, i) => {
              const isRemoving = removingId === c.id;
              const identifier = c.invitedEmail ?? (c.userId ? shortId(c.userId) : "Unknown");
              const initial = (c.invitedEmail?.[0] ?? c.userId?.[0] ?? "?").toUpperCase();

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 18px", gap: 14,
                    borderBottom: i < collaborators.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    opacity: isRemoving ? 0.4 : 1,
                    transition: "opacity 200ms",
                  }}
                >
                  {/* Left: avatar + info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: "#0A0A0A", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {initial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {identifier}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 2 }}>
                        {c.role} · invited {formatRelativeTime(c.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Right: split + status + remove */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono)", color: "#555" }}>
                      {formatPercent(c.splitPercentage)}
                    </span>
                    <StatusBadge status={c.status} />
                    {isOwner && (
                      <button
                        onClick={() => handleRemovePrompt(c.id, identifier)}
                        disabled={isRemoving}
                        title="Remove collaborator"
                        style={{
                          background: "none", border: "none", padding: 4,
                          cursor: isRemoving ? "not-allowed" : "pointer",
                          color: "#ccc", transition: "color 120ms",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#DC2626"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How invitations work note */}
          <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.03)" }}>
            <p style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: "#ccc", marginBottom: 10 }}>
              How invitations work
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { step: "01", text: "Collaborator receives an email invitation with a link to join this Pool." },
                { step: "02", text: "If they already have a Splitpay account, they confirm the invitation." },
                { step: "03", text: "New users can register with the invited email to join directly." },
                { step: "04", text: "Once confirmed, they can add a payout account for fund distribution." },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#ccc", fontFamily: "var(--font-mono)", flexShrink: 0, paddingTop: 1 }}>{step}</span>
                  <span style={{ fontSize: 12.5, color: "#aaa", lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div style={{ marginTop: 36 }}>
        <Link
          href={`/dashboard/pools/${poolId}`}
          style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, transition: "color 120ms" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Pool
        </Link>
      </div>

    </div>
  );
}

/* ─── Helpers ─────────────────────────────────── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 11.5, color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 9,
    border: `1px solid ${hasError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
    background: "#fff", fontSize: 13.5, color: "#0A0A0A",
    outline: "none", fontFamily: "var(--font-sans)",
    transition: "border-color 140ms, box-shadow 140ms",
  };
}

function focusRing(e: React.FocusEvent<HTMLElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "rgba(220,38,38,0.7)" : "#0A0A0A";
  e.currentTarget.style.boxShadow = hasError ? "0 0 0 2px rgba(220,38,38,0.12)" : "0 0 0 2px rgba(0,0,0,0.08)";
}

function blurRing(e: React.FocusEvent<HTMLElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)";
  e.currentTarget.style.boxShadow = "none";
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", transition: "color 120ms" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}>
      {children}
    </Link>
  );
}

function Chevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function PageSkeleton() {
  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
      <Bone width={200} height={10} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone width={80} height={8} />
          <Bone width={180} height={16} />
        </div>
        <Bone width={140} height={38} radius="100px" />
      </div>
      <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
        {[1, 2].map(i => (
          <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Bone width={34} height={34} radius="50%" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Bone width={180} height={12} />
                <Bone width={120} height={9} />
              </div>
            </div>
            <Bone width={90} height={9} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PageError({ message, status, poolId }: { message: string; status: number | null; poolId: string }) {
  const isAuth = status === 401 || status === 403;
  return (
    <div style={{ maxWidth: 440, paddingTop: 48 }}>
      <p style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8 }}>
        {isAuth ? "Access denied" : "Something went wrong"}
      </p>
      <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
        {isAuth ? "Your session may have expired." : message}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {isAuth
          ? <Link href="/login" style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Log in</Link>
          : <button onClick={() => window.location.reload()} style={{ padding: "9px 20px", borderRadius: 100, background: "#0A0A0A", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Try again</button>
        }
        <Link href={`/dashboard/pools/${poolId}`} style={{ padding: "9px 16px", fontSize: 13, color: "#888", textDecoration: "none" }}>
          Back to Pool
        </Link>
      </div>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "skeletonPulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}
