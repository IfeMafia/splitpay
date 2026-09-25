"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { formatRelativeTime } from "../../../lib/format";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

type Filter = "all" | "unread";
type PageState = "loading" | "ready" | "error";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<NotificationItem[]>("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
      setPageState("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load notifications");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await api.patch(`/notifications/${id}/read`, {});
    } catch {
      // Revert on error
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await api.patch("/notifications/read-all", {});
    } catch {
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#bbb",
              marginBottom: 5,
            }}
          >
            Activity
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#0A0A0A",
                lineHeight: 1.2,
              }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "#0A0A0A",
                  color: "#fff",
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#666",
              background: "transparent",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: markingAll ? "not-allowed" : "pointer",
              transition: "all 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0A0A0A";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#666";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
            }}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 24,
          background: "rgba(0,0,0,0.04)",
          borderRadius: 9,
          padding: 3,
          width: "fit-content",
        }}
      >
        {(["all", "unread"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "6px 16px",
              borderRadius: 7,
              border: "none",
              background: filter === tab ? "#fff" : "transparent",
              color: filter === tab ? "#0A0A0A" : "#888",
              fontSize: 12.5,
              fontWeight: filter === tab ? 500 : 400,
              cursor: "pointer",
              fontFamily: "var(--font-outfit)",
              boxShadow:
                filter === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 120ms",
            }}
          >
            {tab === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Content states */}
      {pageState === "loading" && <NotificationsSkeleton />}

      {pageState === "error" && (
        <div
          style={{
            padding: "20px",
            borderRadius: 12,
            background: "rgba(220,38,38,0.05)",
            border: "1px solid rgba(220,38,38,0.15)",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 13, color: "#991B1B", margin: 0 }}>
            {errorMsg}
          </p>
        </div>
      )}

      {pageState === "ready" && filteredNotifications.length === 0 && (
        <div style={{ paddingTop: 32, paddingBottom: 48, textAlign: "left" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#0A0A0A",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "#888",
              lineHeight: 1.6,
              maxWidth: 380,
              marginBottom: 24,
            }}
          >
            {filter === "unread"
              ? "You are all caught up! Switch to 'All' to view your historical activity."
              : "Activity from your pools — like payment confirmations, collaborator acceptances, and split allocations — will appear here."}
          </p>
          <Link
            href="/dashboard/pools"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 500,
              color: "#555",
              textDecoration: "none",
              transition: "color 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#0A0A0A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#555";
            }}
          >
            Go to your Pools
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      )}

      {pageState === "ready" && filteredNotifications.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.08)",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {filteredNotifications.map((n, idx) => {
            const poolId = (n.data as any)?.poolId;
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 18px",
                  background: n.isRead ? "#fff" : "rgba(10, 10, 10, 0.015)",
                  borderBottom:
                    idx < filteredNotifications.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                  transition: "background 120ms",
                }}
              >
                {/* Status Dot / Icon */}
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  <TypeIcon type={n.type} isRead={n.isRead} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 13.5,
                        fontWeight: n.isRead ? 500 : 600,
                        color: "#0A0A0A",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {n.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#999",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: "#666",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {n.message}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {poolId && (
                      <Link
                        href={`/dashboard/pools/${poolId}`}
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#0A0A0A",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        View Pool
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{
                          fontSize: 11.5,
                          color: "#888",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TypeIcon({ type, isRead }: { type: string; isRead: boolean }) {
  if (type === "PAYMENT_ALLOCATED") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isRead ? "#F4FBF6" : "#E6F7EC",
          color: "#16A34A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
    );
  }

  if (type === "INVITATION_ACCEPTED" || type === "MEMBER_JOINED") {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isRead ? "#F5F8FF" : "#EAF0FF",
          color: "#2563EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: isRead ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.06)",
        color: "#555",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 14,
            padding: "18px",
            borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.06)" : "none",
            animation: "pulse 1.5s infinite ease-in-out",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#F0F0F0",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "40%",
                height: 14,
                background: "#F0F0F0",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: "80%",
                height: 12,
                background: "#F0F0F0",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
