"use client";

type Status =
  | "ACTIVE" | "COMPLETED" | "ARCHIVED" | "DRAFT"
  | "PENDING" | "SUCCESS" | "FAILED" | "PROCESSING"
  | "INVITED" | "CONFIRMED" | "REMOVED"
  | "ACCEPTED" | "DECLINED";

const LABEL: Record<Status, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  PENDING: "Pending",
  SUCCESS: "Paid",
  FAILED: "Failed",
  PROCESSING: "Processing",
  INVITED: "Invited",
  CONFIRMED: "Confirmed",
  REMOVED: "Removed",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

const DOT_COLOR: Record<Status, string> = {
  ACTIVE: "#16A34A",
  COMPLETED: "#16A34A",
  SUCCESS: "#16A34A",
  ACCEPTED: "#16A34A",
  CONFIRMED: "#16A34A",
  PENDING: "#CA8A04",
  INVITED: "#CA8A04",
  PROCESSING: "#2563EB",
  FAILED: "#DC2626",
  DECLINED: "#DC2626",
  REMOVED: "#DC2626",
  ARCHIVED: "#9CA3AF",
  DRAFT: "#9CA3AF",
};

const BG: Record<Status, string> = {
  ACTIVE: "rgba(22,163,74,0.08)",
  COMPLETED: "rgba(22,163,74,0.08)",
  SUCCESS: "rgba(22,163,74,0.08)",
  ACCEPTED: "rgba(22,163,74,0.08)",
  CONFIRMED: "rgba(22,163,74,0.08)",
  PENDING: "rgba(202,138,4,0.08)",
  INVITED: "rgba(202,138,4,0.08)",
  PROCESSING: "rgba(37,99,235,0.08)",
  FAILED: "rgba(220,38,38,0.08)",
  DECLINED: "rgba(220,38,38,0.08)",
  REMOVED: "rgba(220,38,38,0.08)",
  ARCHIVED: "rgba(0,0,0,0.05)",
  DRAFT: "rgba(0,0,0,0.05)",
};

const TEXT_COLOR: Record<Status, string> = {
  ACTIVE: "#166534",
  COMPLETED: "#166534",
  SUCCESS: "#166534",
  ACCEPTED: "#166534",
  CONFIRMED: "#166534",
  PENDING: "#854D0E",
  INVITED: "#854D0E",
  PROCESSING: "#1E40AF",
  FAILED: "#991B1B",
  DECLINED: "#991B1B",
  REMOVED: "#991B1B",
  ARCHIVED: "#6B7280",
  DRAFT: "#6B7280",
};

interface Props {
  status: Status | string;
}

export default function StatusBadge({ status }: Props) {
  const s = (status as Status) in LABEL ? (status as Status) : "DRAFT";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 500,
        background: BG[s],
        color: TEXT_COLOR[s],
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: DOT_COLOR[s],
          flexShrink: 0,
        }}
      />
      {LABEL[s]}
    </span>
  );
}
