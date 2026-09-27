"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PoolNavTabsProps {
  poolId: string;
  isOwner: boolean;
  memberCount?: number;
  paymentCount?: number;
}

export default function PoolNavTabs({
  poolId,
  isOwner,
  memberCount,
  paymentCount,
}: PoolNavTabsProps) {
  const pathname = usePathname();

  const baseUrl = `/dashboard/pools/${poolId}`;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      href: baseUrl,
      exact: true,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: "members",
      label: isOwner ? "Team & Collaborators" : "Collaborators",
      href: `${baseUrl}/members`,
      count: memberCount,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "payments",
      label: isOwner ? "Payment Links" : "Payment Status",
      href: `${baseUrl}/payments`,
      count: paymentCount,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      id: "split",
      label: isOwner ? "Split Configuration" : "My Allocation & Split",
      href: `${baseUrl}/split`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" />
          <path d="M12 12L22 12" />
        </svg>
      ),
    },
    {
      id: "withdrawals",
      label: isOwner ? "Treasury & Balance" : "My Balance & Payouts",
      href: `${baseUrl}/withdrawals`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        paddingBottom: 2,
        marginBottom: 28,
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#0A0A0A" : "#777",
              background: isActive ? "rgba(0,0,0,0.05)" : "transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 120ms ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "#0A0A0A";
                e.currentTarget.style.background = "rgba(0,0,0,0.025)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "#777";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                opacity: isActive ? 1 : 0.65,
              }}
            >
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 100,
                  background: isActive ? "#0A0A0A" : "rgba(0,0,0,0.06)",
                  color: isActive ? "#fff" : "#777",
                }}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
