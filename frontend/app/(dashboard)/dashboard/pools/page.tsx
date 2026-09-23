"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatAmount, formatDate } from "../../../lib/format";

interface Pool {
  id: string;
  name: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

type LoadState = "loading" | "ready" | "error";

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

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
        setErrorMsg(err instanceof Error ? err.message : "Failed to load Pools.");
        setLoadState("error");
      });
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            Pools
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
            Your Pools
          </h1>
        </div>
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

      {/* Empty */}
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
            Create your first Pool to get started. Each Pool is a shared workspace for one collaborative project.
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

      {/* Pools list */}
      {loadState === "ready" && pools.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: "#bbb", marginBottom: 10 }}>
            {pools.length} {pools.length === 1 ? "Pool" : "Pools"}
          </p>
          <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            {pools.map((pool, i) => (
              <Link
                key={pool.id}
                href={`/dashboard/pools/${pool.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "15px 18px", gap: 14,
                  borderBottom: i < pools.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  textDecoration: "none", transition: "background 100ms",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "#0A0A0A", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {pool.name.trim()[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0A0A0A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {pool.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 2 }}>
                      {pool.description
                        ? pool.description.length > 50 ? pool.description.slice(0, 50) + "…" : pool.description
                        : formatDate(pool.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}>
                    {formatAmount(pool.totalAmount, pool.currency)}
                  </span>
                  <StatusBadge status={pool.status} />
                </div>
              </Link>
            ))}
          </div>
        </>
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
