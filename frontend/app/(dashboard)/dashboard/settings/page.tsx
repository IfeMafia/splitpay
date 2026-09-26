"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "../../../lib/api";
import { clearToken } from "../../../lib/auth";
import { useRouter } from "next/navigation";

/* ─── Types ───────────────────────────────────── */

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  kycStatus: string;
  defaultCurrency: string;
  country: string;
  createdAt: string;
}

type PageState = "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

interface FormErrors {
  fullName?: string;
  phone?: string;
  defaultCurrency?: string;
}

/* ─── Page ────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("");

  // Save state
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    api.get<UserProfile>("/users/me")
      .then(data => {
        setProfile(data);
        setFullName(data.fullName);
        setPhone(data.phone ?? "");
        setDefaultCurrency(data.defaultCurrency);
        setPageState("ready");
      })
      .catch(err => {
        if (err instanceof ApiError) setErrorStatus(err.status);
        setErrorMsg(err instanceof Error ? err.message : "Failed to load profile.");
        setPageState("error");
      });
  }, []);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fullName.trim()) errs.fullName = "Name is required.";
    if (defaultCurrency && defaultCurrency.length !== 3)
      errs.defaultCurrency = "Enter a valid 3-letter currency code.";
    return errs;
  }

  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  function markDirty() {
    setIsDirty(true);
    if (saveState === "saved") setSaveState("idle");
  }

  const liveErrors = Object.keys(touched).length > 0 ? validate() : {};

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, phone: true, defaultCurrency: true });
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaveState("saving");
    setSaveError("");
    try {
      const updated = await api.patch<UserProfile>("/users/me", {
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(defaultCurrency.trim() ? { defaultCurrency: defaultCurrency.trim().toUpperCase() } : {}),
      });
      setProfile(updated);
      setSaveState("saved");
      setIsDirty(false);
      setTouched({});
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
      setSaveState("error");
    }
  }

  function handleSignOut() {
    clearToken();
    router.replace("/login");
  }

  /* ── Loading ── */
  if (pageState === "loading") {
    return (
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone width={80} height={9} />
          <Bone width={160} height={18} />
        </div>
        <Bone width="100%" height={1} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <Bone width={90} height={10} />
              <Bone width="100%" height={40} radius="9px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (pageState === "error") {
    const isAuth = errorStatus === 401 || errorStatus === 403;
    return (
      <div style={{ maxWidth: 440, paddingTop: 24 }}>
        <p style={{ fontSize: 17, fontWeight: 500, color: "#0A0A0A", marginBottom: 8 }}>
          {isAuth ? "Session expired" : "Could not load profile"}
        </p>
        <p style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65, marginBottom: 24 }}>
          {isAuth ? "Please log in again to access your settings." : errorMsg}
        </p>
        {isAuth
          ? <button onClick={handleSignOut} style={dangerBtnStyle}>Sign out</button>
          : <button onClick={() => window.location.reload()} style={primaryBtnStyle}>Try again</button>
        }
      </div>
    );
  }

  if (!profile) return null;

  const isSubmitting = saveState === "saving";

  return (
    <div style={{ maxWidth: 560 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#bbb", marginBottom: 5 }}>
          Account
        </p>
        <h1 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", lineHeight: 1.2 }}>
          Settings
        </h1>
      </div>

      {/* ── Profile section ── */}
      <Section label="Profile">
        <form onSubmit={handleSave} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Save success */}
          {saveState === "saved" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p style={{ fontSize: 12.5, color: "#166534" }}>Changes saved.</p>
            </div>
          )}

          {/* Save error */}
          {saveState === "error" && saveError && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{ fontSize: 12.5, color: "#991B1B" }}>{saveError}</p>
            </div>
          )}

          {/* Email — read-only */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A" }}>Email address</label>
            <div style={{
              padding: "10px 13px", borderRadius: 9,
              border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFA",
              fontSize: 13.5, color: "#888",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>{profile.email}</span>
              <span style={{ fontSize: 11, color: "#bbb" }}>Cannot be changed</span>
            </div>
          </div>

          {/* Full name */}
          <Field label="Full name" error={liveErrors.fullName ?? formErrors.fullName}>
            <input
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); markDirty(); }}
              placeholder="Your full name"
              disabled={isSubmitting}
              style={inputStyle(!!(liveErrors.fullName ?? formErrors.fullName))}
              onFocus={e => focusRing(e, !!(liveErrors.fullName ?? formErrors.fullName))}
              onBlur={(e) => { touch("fullName"); blurRing(e, !!(liveErrors.fullName ?? formErrors.fullName)); }}
            />
          </Field>

          {/* Phone */}
          <Field label="Phone number" hint="Optional" error={liveErrors.phone ?? formErrors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); markDirty(); }}
              placeholder="+234 800 000 0000"
              disabled={isSubmitting}
              style={inputStyle(!!(liveErrors.phone ?? formErrors.phone))}
              onFocus={e => focusRing(e, !!(liveErrors.phone ?? formErrors.phone))}
              onBlur={(e) => { touch("phone"); blurRing(e, !!(liveErrors.phone ?? formErrors.phone)); }}
            />
          </Field>

          {/* Default currency */}
          <Field label="Default currency" hint="3-letter ISO code" error={liveErrors.defaultCurrency ?? formErrors.defaultCurrency}>
            <input
              type="text"
              value={defaultCurrency}
              onChange={e => { setDefaultCurrency(e.target.value.toUpperCase()); markDirty(); }}
              placeholder="NGN"
              maxLength={3}
              disabled={isSubmitting}
              style={{ ...inputStyle(!!(liveErrors.defaultCurrency ?? formErrors.defaultCurrency)), fontFamily: "var(--font-geist-mono)", width: 100 }}
              onFocus={e => focusRing(e, !!(liveErrors.defaultCurrency ?? formErrors.defaultCurrency))}
              onBlur={(e) => { touch("defaultCurrency"); blurRing(e, !!(liveErrors.defaultCurrency ?? formErrors.defaultCurrency)); }}
            />
          </Field>

          {/* Save button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 22px", borderRadius: 100,
                background: isSubmitting || !isDirty ? "rgba(0,0,0,0.06)" : "#0A0A0A",
                color: isSubmitting || !isDirty ? "#bbb" : "#fff",
                border: "none", fontSize: 13, fontWeight: 500,
                cursor: isSubmitting || !isDirty ? "not-allowed" : "pointer",
                fontFamily: "var(--font-outfit)", transition: "all 140ms",
              }}
              onMouseEnter={e => { if (!isSubmitting && isDirty) (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={e => { if (!isSubmitting && isDirty) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
            >
              {isSubmitting ? <><Spinner /> Saving…</> : "Save changes"}
            </button>
          </div>
        </form>
      </Section>

      {/* ── Account details (read-only) ── */}
      <Section label="Account details">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <DetailRow label="Account ID">
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11.5, color: "#888" }}>
              {profile.id.slice(0, 16)}…
            </span>
          </DetailRow>
          <DetailRow label="KYC status">
            <span style={{
              fontSize: 11.5, fontWeight: 500,
              color: profile.kycStatus === "VERIFIED" ? "#166534" : profile.kycStatus === "PENDING" ? "#854D0E" : "#888",
            }}>
              {profile.kycStatus}
            </span>
          </DetailRow>
          <DetailRow label="Country">
            <span style={{ fontSize: 13, color: "#555" }}>{profile.country}</span>
          </DetailRow>
          <DetailRow label="Member since">
            <span style={{ fontSize: 13, color: "#555" }}>
              {new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </DetailRow>
        </div>
      </Section>

      {/* ── Sign out ── */}
      <Section label="Session">
        <div>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 16, maxWidth: 360 }}>
            Signing out will clear your session. You&apos;ll need to log in again to access your Pools.
          </p>
          <button
            onClick={handleSignOut}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "none", color: "#DC2626",
              border: "1px solid rgba(220,38,38,0.25)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-outfit)", transition: "all 140ms",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(220,38,38,0.25)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </Section>

    </div>
  );
}

/* ─── Sub-components ─────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
      <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 20 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 500, color: "#0A0A0A" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "#bbb" }}>{hint}</span>}
      </div>
      {children}
      {error && <p style={{ fontSize: 11.5, color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 12.5, color: "#bbb", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 9,
    border: `1px solid ${hasError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
    background: "#fff", fontSize: 13.5, color: "#0A0A0A",
    outline: "none", fontFamily: "var(--font-outfit)",
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

const primaryBtnStyle: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 100, background: "#0A0A0A",
  color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "var(--font-outfit)",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 100, background: "none",
  color: "#DC2626", border: "1px solid rgba(220,38,38,0.3)",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "var(--font-outfit)",
};

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(0,0,0,0.06)", animation: "sp-pulse 1.4s ease-in-out infinite", flexShrink: 0 }}>
      <style>{`@keyframes sp-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
