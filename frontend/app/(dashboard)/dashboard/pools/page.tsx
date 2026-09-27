"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatAmount, formatDate } from "../../../lib/format";
import { getUser } from "@/app/lib/auth";

interface Pool {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  currency: string;
  status: string;
  createdAt: string;
  ownerId?: string;
  userRole?: string;
}

type LoadState = "loading" | "ready" | "error";
type FilterTab = "all" | "created" | "collaborations";

export default function PoolsPage() {
  const cachedProjects = api.getCached<Pool[]>("/projects") || api.getCached<Pool[]>("/pools");
  const [pools, setPools] = useState<Pool[]>(cachedProjects ?? []);
  const [loadState, setLoadState] = useState<LoadState>(cachedProjects ? "ready" : "loading");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = getUser();
  const currentUserId = currentUser?.id;

  const router = useRouter();

  // Join by invite code
  const [showJoin, setShowJoin] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");

  function handleJoin() {
    let raw = joinInput.trim();
    if (!raw) {
      setJoinError("Please enter an invite code or link.");
      return;
    }
    setJoinError("");
    raw = raw.replace(/\/+$/, "");
    let token = raw;
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] || raw;
      }
    } catch {
      // Treated as raw token / code
    }
    router.push(`/join/${token}`);
  }

  useEffect(() => {
    api.get<Pool[]>("/projects")
      .then(data => {
        setPools(Array.isArray(data) ? data : []);
        setLoadState("ready");
      })
      .catch(err => {
        if (err.name === "ApiError") {
          setErrorStatus(err.status);
        }
        if (!cachedProjects) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load Pools.");
          setLoadState("error");
        }
      });
  }, []);

  const { createdPools, collabPools, filteredPools } = useMemo(() => {
    const created = pools.filter(p => p.ownerId === currentUserId || p.userRole === 'OWNER');
    const collab = pools.filter(p => p.ownerId !== currentUserId && p.userRole !== 'OWNER');

    let base = pools;
    if (activeTab === "created") base = created;
    if (activeTab === "collaborations") base = collab;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    return { createdPools: created, collabPools: collab, filteredPools: base };
  }, [pools, currentUserId, activeTab, searchQuery]);

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            Workspaces
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            Pools & Splits
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => { setShowJoin(s => !s); setJoinError(""); setJoinInput(""); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "none", color: "#555", border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "background 140ms", flexShrink: 0,
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
            </svg>
            Join a Pool
          </button>
          <Link
            href="/dashboard/pools/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "#0A0A0A", color: "#fff",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "background 140ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Pool
          </Link>
        </div>
      </div>

      {/* Join by invite code section */}
      {showJoin && (
        <div style={{
          marginBottom: 24, padding: "18px 20px", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.10)", background: "#fff",
        }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", marginBottom: 4 }}>Join a Pool</p>
          <p style={{ fontSize: 12.5, color: "#999", marginBottom: 14 }}>Paste an invite link or code shared with you by the Pool owner.</p>
          {joinError && <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{joinError}</p>}
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              type="text"
              placeholder="e.g. hsy or splitpay.com/join/hsy"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              style={{
                flex: 1, padding: "10px 13px", borderRadius: 9,
                border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
                fontSize: 13, color: "#0A0A0A", outline: "none",
                fontFamily: "var(--font-mono)",
              }}
              autoFocus
            />
            <button
              onClick={handleJoin}
              style={{
                padding: "10px 18px", borderRadius: 9,
                background: "#0A0A0A", color: "#fff", border: "none",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                whiteSpace: "nowrap", fontFamily: "inherit",
              }}
            >
              Join
            </button>
            <button
              onClick={() => { setShowJoin(false); setJoinInput(""); setJoinError(""); }}
              style={{
                padding: "10px 14px", borderRadius: 9,
                background: "none", border: "1px solid rgba(0,0,0,0.10)",
                color: "#888", fontSize: 13, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      {loadState === "ready" && pools.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 20, flexWrap: "wrap",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 2, background: "rgba(0,0,0,0.04)",
            borderRadius: 9, padding: 3, width: "fit-content",
          }}>
            {[
              { id: "all" as const, label: "All Pools", count: pools.length },
              { id: "created" as const, label: "Created by You", count: createdPools.length },
              { id: "collaborations" as const, label: "Collaborations", count: collabPools.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 7, border: "none",
                  background: activeTab === tab.id ? "#fff" : "transparent",
                  color: activeTab === tab.id ? "#0A0A0A" : "#777",
                  fontSize: 12.5, fontWeight: activeTab === tab.id ? 500 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 120ms ease",
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 100,
                  background: activeTab === tab.id ? "#0A0A0A" : "rgba(0,0,0,0.06)",
                  color: activeTab === tab.id ? "#fff" : "#888",
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search pools…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "7px 12px 7px 30px", borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                fontSize: 12.5, color: "#0A0A0A", outline: "none",
              }}
            />
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadState === "loading" && (
        <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, overflow: "hidden" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: "16px 18px", borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Bone width={32} height={32} radius="8px" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Bone width={160} height={11} />
                  <Bone width={100} height={9} />
                </div>
              </div>
              <Bone width={70} height={10} />
            </div>
          ))}
        </div>
      )}

      {/* Authentication Error (401) */}
      {loadState === "error" && errorStatus === 401 && (
        <div style={{ paddingTop: 48, maxWidth: 400 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Session expired
          </h2>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
            Please log in again to view your Pools. Your authentication token is missing or has expired.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", borderRadius: 100,
              background: "#0A0A0A", color: "#fff",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}
          >
            Go to Login
          </Link>
        </div>
      )}

      {/* Server Error (Other than 401) */}
      {loadState === "error" && errorStatus !== 401 && (
        <div style={{
          padding: "16px 18px", borderRadius: 12,
          background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#991B1B" }}>{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                alignSelf: "flex-start",
                padding: "6px 12px", borderRadius: 6,
                background: "rgba(220,38,38,0.1)", color: "#991B1B", border: "none",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty overall */}
      {loadState === "ready" && pools.length === 0 && (
        <div style={{ paddingTop: 48, maxWidth: 400 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>
            No Pools yet
          </h2>
          <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
            Create your first Pool to get started, or join a collaborative workspace with an invite link.
          </p>
          <Link
            href="/dashboard/pools/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", borderRadius: 100,
              background: "#0A0A0A", color: "#fff",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create a Pool
          </Link>
        </div>
      )}

      {/* Empty tab results */}
      {loadState === "ready" && pools.length > 0 && filteredPools.length === 0 && (
        <div style={{
          padding: "36px 20px", textAlign: "center", background: "#fff",
          borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)",
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginBottom: 4 }}>
            {activeTab === "created"
              ? "You haven't created any pools yet"
              : activeTab === "collaborations"
              ? "You haven't joined any collaboration pools yet"
              : "No matching pools found"}
          </p>
          <p style={{ fontSize: 12.5, color: "#888" }}>
            {activeTab === "created"
              ? "Click 'New Pool' above to set up your first managed workspace."
              : activeTab === "collaborations"
              ? "When someone invites you to their pool, it will appear here."
              : "Try adjusting your search query or filter tab."}
          </p>
        </div>
      )}

      {/* Pools list */}
      {loadState === "ready" && filteredPools.length > 0 && (
        <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, background: "#fff", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {filteredPools.map((pool, i) => {
            const isOwner = pool.ownerId === currentUserId || pool.userRole === "OWNER";
            return (
              <Link
                key={pool.id}
                href={`/dashboard/pools/${pool.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", gap: 16,
                  borderBottom: i < filteredPools.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  textDecoration: "none", transition: "background 100ms",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isOwner ? "#0A0A0A" : "#2563EB", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 600,
                  }}>
                    {pool.name.trim()[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {pool.name}
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600,
                        color: isOwner ? "#0A0A0A" : "#2563EB",
                        background: isOwner ? "rgba(0,0,0,0.06)" : "rgba(37,99,235,0.08)",
                        padding: "1.5px 7px", borderRadius: 100,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        {isOwner ? "Owner" : "Collaborator"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {pool.description
                        ? pool.description.length > 55 ? pool.description.slice(0, 55) + "…" : pool.description
                        : `Created ${formatDate(pool.createdAt)}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "#888" }}>
                    {pool.memberCount} {pool.memberCount === 1 ? "member" : "members"}
                  </span>
                  <StatusBadge status={pool.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "rgba(0,0,0,0.06)",
      animation: "skeletonPulse 1.4s ease-in-out infinite",
      flexShrink: 0,
    }}>
      <style>{`@keyframes skeletonPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}
