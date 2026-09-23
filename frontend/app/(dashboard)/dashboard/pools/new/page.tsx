"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/api";

type State = "idle" | "submitting" | "error";

interface FieldError {
  name?: string;
  description?: string;
  totalAmount?: string;
  currency?: string;
}

const CURRENCIES = [
  { code: "NGN", label: "NGN — Nigerian Naira" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "EUR", label: "EUR — Euro" },
];

function validate(fields: { name: string; description: string; totalAmount: string; currency: string }): FieldError {
  const errors: FieldError = {};
  if (!fields.name.trim()) errors.name = "Pool name is required.";
  else if (fields.name.trim().length < 3) errors.name = "Name must be at least 3 characters.";
  if (fields.description.length > 300) errors.description = "Description must be 300 characters or fewer.";
  if (!fields.totalAmount) errors.totalAmount = "Expected amount is required.";
  else if (isNaN(Number(fields.totalAmount)) || Number(fields.totalAmount) <= 0)
    errors.totalAmount = "Enter a valid positive amount.";
  if (!fields.currency) errors.currency = "Select a currency.";
  return errors;
}

export default function CreatePoolPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [errors, setErrors] = useState<FieldError>({});
  const [state, setState] = useState<State>("idle");
  const [serverError, setServerError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const liveErrors = touched.name || touched.description || touched.totalAmount
    ? validate({ name, description, totalAmount, currency })
    : {};

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched = { name: true, description: true, totalAmount: true, currency: true };
    setTouched(allTouched);
    const errs = validate({ name, description, totalAmount, currency });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("submitting");
    setServerError("");

    try {
      const project = await api.post<{ id: string }>("/projects", {
        name: name.trim(),
        description: description.trim() || undefined,
        totalAmount: Number(totalAmount),
        currency,
      });
      router.push(`/dashboard/pools/${project.id}`);
    } catch (err: unknown) {
      setState("error");
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const charLeft = 300 - description.length;
  const isSubmitting = state === "submitting";

  return (
    <div style={{ maxWidth: 620 }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 12.5, color: "#aaa", textDecoration: "none", transition: "color 120ms" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
        >
          Dashboard
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ fontSize: 12.5, color: "#0A0A0A" }}>New Pool</span>
      </div>

      {/* Page heading */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 8, lineHeight: 1.25 }}>
          Create a Pool
        </h1>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>
          A Pool is the workspace for one project. Once created, you can add collaborators and generate a payment link.
        </p>
      </div>

      {/* Server error banner */}
      {state === "error" && serverError && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 16px", borderRadius: 10,
          background: "rgba(220,38,38,0.06)",
          border: "1px solid rgba(220,38,38,0.15)",
          marginBottom: 28,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Pool name */}
        <Field
          label="Pool name"
          hint="Give this project a clear, identifiable name."
          error={liveErrors.name}
        >
          <input
            ref={nameRef}
            id="pool-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => touch("name")}
            placeholder="e.g. Brand Film — Pepsi Q4"
            disabled={isSubmitting}
            autoFocus
            style={inputStyle(!!liveErrors.name)}
            onFocus={e => applyFocus(e, !!liveErrors.name)}
            onBlurCapture={e => removeFocus(e, !!liveErrors.name)}
          />
        </Field>

        {/* Description */}
        <Field
          label="Description"
          hint="Optional. Provide context for collaborators."
          error={liveErrors.description}
          aside={
            <span style={{ fontSize: 11, color: charLeft < 50 ? "#DC2626" : "#bbb" }}>
              {charLeft} left
            </span>
          }
        >
          <textarea
            id="pool-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={() => touch("description")}
            placeholder="Brief description of the project scope, client, or deliverables."
            disabled={isSubmitting}
            rows={3}
            style={{
              ...inputStyle(!!liveErrors.description),
              resize: "vertical",
              minHeight: 88,
              lineHeight: 1.6,
            }}
            onFocus={e => applyFocus(e, !!liveErrors.description)}
            onBlurCapture={e => removeFocus(e, !!liveErrors.description)}
          />
        </Field>

        {/* Amount + Currency in a row */}
        <div className="pool-amount-row" style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
          <style>{`@media (max-width: 480px) { .pool-amount-row { grid-template-columns: 1fr !important; } }`}</style>

          <Field
            label="Expected amount"
            hint="The total payment amount you expect from your client."
            error={liveErrors.totalAmount}
          >
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: "#999", pointerEvents: "none", fontFamily: "var(--font-mono)",
              }}>
                {currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "€"}
              </span>
              <input
                id="pool-amount"
                type="number"
                min="1"
                step="any"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                onBlur={() => touch("totalAmount")}
                placeholder="0.00"
                disabled={isSubmitting}
                style={{ ...inputStyle(!!liveErrors.totalAmount), paddingLeft: 30, fontFamily: "var(--font-mono)" }}
                onFocus={e => applyFocus(e, !!liveErrors.totalAmount)}
                onBlurCapture={e => removeFocus(e, !!liveErrors.totalAmount)}
              />
            </div>
          </Field>

          <Field label="Currency" error={liveErrors.currency}>
            <div style={{ position: "relative" }}>
              <select
                id="pool-currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                disabled={isSubmitting}
                style={{
                  ...inputStyle(!!liveErrors.currency),
                  appearance: "none",
                  paddingRight: 32,
                  cursor: "pointer",
                }}
                onFocus={e => applyFocus(e, !!liveErrors.currency)}
                onBlurCapture={e => removeFocus(e, !!liveErrors.currency)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </Field>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 100,
              background: isSubmitting ? "#555" : "#0A0A0A",
              color: "#fff", border: "none",
              fontSize: 13.5, fontWeight: 500, cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 140ms",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#222"; }}
            onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#0A0A0A"; }}
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Creating Pool…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Pool
              </>
            )}
          </button>

          <Link
            href="/dashboard"
            style={{
              fontSize: 13.5, color: "#888", textDecoration: "none",
              padding: "11px 16px", borderRadius: 100,
              transition: "color 120ms, background 120ms",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0A0A0A"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Cancel
          </Link>
        </div>

        {/* What happens next */}
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "#ccc", marginBottom: 14 }}>
            After creation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Add collaborators to the Pool.",
              "Generate a payment link to send to your client.",
              "Once paid, configure how funds are split.",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#ccc", fontFamily: "var(--font-mono)", paddingTop: 2, flexShrink: 0 }}>
                  0{i + 1}
                </span>
                <span style={{ fontSize: 13, color: "#aaa", lineHeight: 1.55 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </form>
    </div>
  );
}

function Field({
  label, hint, error, aside, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A", display: "block" }}>
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p style={{ fontSize: 11.5, color: "#bbb", lineHeight: 1.5 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 11.5, color: "#DC2626", lineHeight: 1.5 }}>{error}</p>
      )}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)"}`,
    background: "#fff",
    fontSize: 13.5,
    color: "#0A0A0A",
    outline: "none",
    fontFamily: "var(--font-sans)",
    transition: "border-color 140ms, box-shadow 140ms",
    boxSizing: "border-box",
  };
}

function applyFocus(e: React.FocusEvent<HTMLElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "rgba(220,38,38,0.7)" : "#0A0A0A";
  e.currentTarget.style.boxShadow = hasError ? "0 0 0 2px rgba(220,38,38,0.12)" : "0 0 0 2px rgba(0,0,0,0.08)";
}

function removeFocus(e: React.FocusEvent<HTMLElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "rgba(220,38,38,0.5)" : "rgba(0,0,0,0.12)";
  e.currentTarget.style.boxShadow = "none";
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
