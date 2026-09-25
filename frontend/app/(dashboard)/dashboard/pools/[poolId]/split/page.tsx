"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../../lib/api";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatAmount, formatPercent, shortId } from "../../../../../lib/format";

/* ─── Types ───────────────────────────────────── */

interface Pool {
  id: string;
  name: string;
  memberCount: number;
  currency: string;
}

interface Collaborator {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  splitPercentage: number;
  status: string;
}

interface Payment {
  status: string;
}

interface SplitMemberShare {
  memberId: string;
  percentage: number;
}

interface SplitConfigResponse {
  id: string;
  poolId: string;
  type: "EQUAL" | "CUSTOM";
  configuration: SplitMemberShare[];
}

interface FinancialChainBreakdown {
  grossAmount: number;
  providerFee: number;
  platformFee: number;
  tax: number;
  distributableAmount: number;
  collaboratorAllocations: Array<{
    collaboratorId: string;
    userId: string | null;
    role: string;
    splitPercentage: number;
    amount: number;
  }>;
}

interface Props {
  params: Promise<{ poolId: string }>;
}

type PageState = "loading" | "ready" | "error";
type SaveState = "idle" | "submitting" | "success" | "error";

/* ─── Page ────────────────────────────────────── */

export default function SplitPage({ params }: Props) {
  const { poolId } = use(params);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [pool, setPool] = useState<Pool | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [initialConfig, setInitialConfig] = useState<SplitConfigResponse | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  
  const [breakdown, setBreakdown] = useState<FinancialChainBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(100000);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setPageState("loading");
    try {
      const [poolData, collabData, configData, paymentData] = await Promise.all([
        api.get<Pool>(`/projects/${poolId}`),
        api.get<Collaborator[]>(`/collaborators/project/${poolId}`).catch(() => [] as Collaborator[]),
        api.get<SplitConfigResponse>(`/pools/${poolId}/split`).catch(() => null),
        api.get<Payment[]>(`/payments/project/${poolId}`).catch(() => [] as Payment[]),
      ]);
      setPool(poolData);
      
      const hasConfirmedPayment = Array.isArray(paymentData) && paymentData.some(p => p.status === "SUCCESSFUL" || p.status === "SUCCESS");
      setIsReadOnly(hasConfirmedPayment);
      
      // Include both confirmed and invited collaborators for splitting
      const activeCollabs = Array.isArray(collabData)
        ? collabData.filter(c => c.status === "CONFIRMED" || c.status === "INVITED" || c.status === "ACTIVE")
        : [];
      setCollaborators(activeCollabs);
      setInitialConfig(configData);

      if (configData) {
        setSplitType(configData.type);
        const shares: Record<string, number> = {};
        configData.configuration.forEach(c => {
          shares[c.memberId] = c.percentage;
        });
        setCustomShares(shares);
      } else {
        setSplitType("EQUAL");
        // default equal
        if (confirmedCollabs.length > 0) {
          const equal = Math.round((100 / confirmedCollabs.length) * 100) / 100;
          const shares: Record<string, number> = {};
          confirmedCollabs.forEach(c => shares[c.id] = equal);
          setCustomShares(shares);
        }
      }

      setPageState("ready");
    } catch (err) {
      if (err instanceof ApiError) setErrorStatus(err.status);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load split configuration.");
      setPageState("error");
    }
  }, [poolId]);

  useEffect(() => { load(); }, [load]);

  // Derive equal shares
  const equalPercentage = collaborators.length > 0 ? Math.round((100 / collaborators.length) * 100) / 100 : 0;
  
  // Calculate total for validation
  const currentTotal = splitType === "EQUAL" 
    ? collaborators.length * equalPercentage 
    : Object.values(customShares).reduce((sum, v) => sum + (Number(v) || 0), 0);
    
  const isCustomValid = Math.abs(currentTotal - 100) < 0.01;

  // Re-calculate financial breakdown when inputs change
  useEffect(() => {
    if (pageState !== "ready" || !pool) return;
    
    if (splitType === "CUSTOM" && !isCustomValid) {
      setBreakdown(null);
      return;
    }

    let isCancelled = false;
    
    async function calculate() {
      setCalculating(true);
      try {
        const collabConfig = collaborators.map(c => ({
          id: c.id,
          userId: c.userId,
          role: c.role,
          splitPercentage: splitType === "EQUAL" ? equalPercentage : (customShares[c.id] || 0)
        }));

        const data = await api.post<FinancialChainBreakdown>("/payments/calculate", {
          amount: previewAmount,
          platformFeePercent: 1.5,
          providerFee: 0,
          collaborators: collabConfig
        });
        
        if (!isCancelled) {
          setBreakdown(data);
        }
      } catch (err) {
        console.error("Calculation failed", err);
      } finally {
        if (!isCancelled) setCalculating(false);
      }
    }
    
    // Add small debounce
    const t = setTimeout(() => calculate(), 300);
    return () => {
      isCancelled = true;
      clearTimeout(t);
    };
  }, [splitType, customShares, collaborators, pool, pageState, equalPercentage, isCustomValid, previewAmount]);

  const handleCustomChange = (memberId: string, val: string) => {
    const num = parseFloat(val);
    setCustomShares(prev => ({
      ...prev,
      [memberId]: isNaN(num) ? 0 : num
    }));
  };

  const handleSave = async () => {
    if (splitType === "CUSTOM" && !isCustomValid) return;
    
    setSaveState("submitting");
    setSaveError("");
    
    try {
      const shares = splitType === "CUSTOM" 
        ? collaborators.map(c => ({ memberId: c.id, percentage: customShares[c.id] || 0 }))
        : collaborators.map(c => ({ memberId: c.id, percentage: equalPercentage }));

      await api.post(`/pools/${poolId}/split`, {
        type: splitType,
        shares
      });
      
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save split configuration.");
      setSaveState("error");
    }
  };

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
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>Split & Allocation</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
            {pool.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
              Split Configuration
            </h1>
            {isReadOnly && (
              <span style={{ fontSize: 11, fontWeight: 500, color: "#166534", background: "rgba(22,163,74,0.1)", padding: "4px 8px", borderRadius: 4 }}>
                Locked
              </span>
            )}
          </div>
        </div>
      </div>
      
      {saveState === "success" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)",
        }}>
          <CheckIcon color="#16A34A" />
          <p style={{ fontSize: 13, color: "#166534" }}>Split configuration updated successfully.</p>
        </div>
      )}

      {saveState === "error" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
        }}>
          <AlertIcon />
          <p style={{ fontSize: 13, color: "#991B1B" }}>{saveError}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Settings Box */}
        <div style={{ padding: 24, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "#fff" }}>
          
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <button
              onClick={() => !isReadOnly && setSplitType("EQUAL")}
              disabled={isReadOnly}
              style={{
                flex: 1, padding: "14px", borderRadius: 10, cursor: isReadOnly ? "default" : "pointer",
                border: splitType === "EQUAL" ? "1px solid #0A0A0A" : "1px solid #eee",
                background: splitType === "EQUAL" ? "#0A0A0A" : "#fff",
                color: splitType === "EQUAL" ? "#fff" : "#0A0A0A",
                opacity: (isReadOnly && splitType !== "EQUAL") ? 0.5 : 1,
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Equal Split</div>
              <div style={{ fontSize: 12, color: splitType === "EQUAL" ? "#aaa" : "#888" }}>Split distributable amount equally</div>
            </button>
            <button
              onClick={() => !isReadOnly && setSplitType("CUSTOM")}
              disabled={isReadOnly}
              style={{
                flex: 1, padding: "14px", borderRadius: 10, cursor: isReadOnly ? "default" : "pointer",
                border: splitType === "CUSTOM" ? "1px solid #0A0A0A" : "1px solid #eee",
                background: splitType === "CUSTOM" ? "#0A0A0A" : "#fff",
                color: splitType === "CUSTOM" ? "#fff" : "#0A0A0A",
                opacity: (isReadOnly && splitType !== "CUSTOM") ? 0.5 : 1,
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Custom Split</div>
              <div style={{ fontSize: 12, color: splitType === "CUSTOM" ? "#aaa" : "#888" }}>Define exact percentages</div>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {collaborators.map(c => {
              const displayEmail = c.invitedEmail || `User ${shortId(c.userId || c.id)}`;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 8, background: "#fcfcfc", border: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{displayEmail}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2, textTransform: "capitalize" }}>{c.role.toLowerCase()}</div>
                  </div>
                  
                  {splitType === "EQUAL" ? (
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{formatPercent(equalPercentage)}</div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={isReadOnly}
                        value={customShares[c.id] === 0 ? "" : customShares[c.id]}
                        onChange={(e) => handleCustomChange(c.id, e.target.value)}
                        placeholder="0"
                        style={{ width: 80, padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, textAlign: "right", background: isReadOnly ? "#f5f5f5" : "#fff" }}
                      />
                      <span style={{ fontSize: 13, color: "#888" }}>%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {splitType === "CUSTOM" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 500, 
                color: isCustomValid ? "#166534" : "#991B1B",
                background: isCustomValid ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
                padding: "6px 12px",
                borderRadius: 6
              }}>
                Total: {currentTotal.toFixed(2)}% {isCustomValid ? "✓" : "— Must be exactly 100%"}
              </div>
            </div>
          )}

          {!isReadOnly && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={handleSave}
                disabled={saveState === "submitting" || (splitType === "CUSTOM" && !isCustomValid)}
                style={{
                  padding: "10px 20px", borderRadius: 100,
                  background: (splitType === "CUSTOM" && !isCustomValid) ? "#ccc" : "#0A0A0A",
                  color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 500, cursor: (splitType === "CUSTOM" && !isCustomValid) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8
                }}
              >
                {saveState === "submitting" ? <Spinner /> : null}
                Save Configuration
              </button>
            </div>
          )}

        </div>

        {/* Financial Breakdown Preview */}
        <div style={{ padding: 24, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "#fff" }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            Financial Breakdown Preview
            {calculating && <Spinner />}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#555" }}>Simulated Amount:</span>
            <input 
              type="number" 
              value={previewAmount} 
              onChange={e => setPreviewAmount(Number(e.target.value) || 0)} 
              style={{ width: 120, padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
            />
          </div>
          
          {(!breakdown && !calculating && splitType === "CUSTOM" && !isCustomValid) && (
            <p style={{ fontSize: 13, color: "#888" }}>Resolve percentage errors to view the breakdown.</p>
          )}

          {breakdown && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, paddingBottom: 24, borderBottom: "1px dashed #eee" }}>
                <SummaryRow label="Gross Pool Amount" value={formatAmount(breakdown.grossAmount, pool.currency)} />
                <SummaryRow label="Provider Fee" value={`- ${formatAmount(breakdown.providerFee, pool.currency)}`} color="#888" />
                <SummaryRow label="Platform Fee (1.5%)" value={`- ${formatAmount(breakdown.platformFee, pool.currency)}`} color="#888" />
                <SummaryRow label="Tax" value={`- ${formatAmount(breakdown.tax, pool.currency)}`} color="#888" />
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 16, borderTop: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Total Distributable</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{formatAmount(breakdown.distributableAmount, pool.currency)}</span>
                </div>
              </div>
              
              <h3 style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Allocations</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {breakdown.collaboratorAllocations.map(c => {
                  const member = collaborators.find(col => col.id === c.collaboratorId);
                  const displayEmail = member?.invitedEmail || `User ${shortId(c.userId || c.collaboratorId)}`;
                  return (
                    <div key={c.collaboratorId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#444" }}>
                        {displayEmail} <span style={{ color: "#aaa", fontSize: 12 }}>({formatPercent(c.splitPercentage)})</span>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{formatAmount(c.amount, pool.currency)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────── */

function SummaryRow({ label, value, color = "#0A0A0A" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>{value}</span>
    </div>
  );
}

function BreadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", transition: "color 0.15s" }}
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

function CheckIcon({ color = "#166534", size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone width={80} height={9} />
          <Bone width={180} height={18} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[1, 2].map(i => <Bone key={i} width="100%" height={230} radius="14px" />)}
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
