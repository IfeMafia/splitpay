/**
 * format.ts — Shared formatting utilities for the Splitpay dashboard.
 * Financial values: always integer minor-units (kobo/cents) from the backend.
 * All display formatting happens here — nowhere else.
 */

/** Convert minor units (kobo/cents) to major units for display. */
export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

/**
 * Format a monetary amount for display.
 * @param amount - value in MAJOR units (₦, $) or already formatted
 * @param currency - ISO 4217 code e.g. "NGN", "USD"
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN"
): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unrecognised currency codes
    return `${currency} ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Format a Prisma Decimal / number already in major units from the backend.
 * Backend stores amounts as Decimal (e.g. 150000.00 = ₦150,000).
 */
export function formatAmount(amount: number | string, currency = "NGN"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "—";
  return formatCurrency(n, currency);
}

/** Format a split percentage (0–100). */
export function formatPercent(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "—";
  return `${n.toFixed(1).replace(/\.0$/, "")}%`;
}

/** Relative time: "2 hours ago", "3 days ago", etc. */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

/** Absolute short date: "23 Sep 2026". */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Shorten a UUID for display: "a7b8a4d8" → "a7b8...". */
export function shortId(id: string): string {
  if (!id || id.length < 8) return id;
  return `${id.slice(0, 8)}…`;
}
