"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EmptyDashboard from "../_components/EmptyDashboard";
import PopulatedDashboard from "../_components/PopulatedDashboard";
import DashboardSkeleton from "../_components/DashboardSkeleton";
import { api } from "@/app/lib/api";
import { getUser } from "@/app/lib/auth";
import { PoolResponse, NotificationResponse } from "@/lib/contracts";

function DashboardContent() {
  const params = useSearchParams();
  const forceDemo = params.get("demo") === "1";
  const forceLoading = params.get("loading") === "1";

  // Check synchronous cache for instant zero-delay rendering
  const cachedPools = api.getCached<PoolResponse[]>("/pools");
  const cachedNotes = api.getCached<NotificationResponse[]>("/notifications");
  const hasAuthoritativeCache = cachedPools !== null;

  const [hasResolved, setHasResolved] = useState<boolean>(hasAuthoritativeCache || forceDemo);
  const [pools, setPools] = useState<PoolResponse[]>(cachedPools ?? []);
  const [notifications, setNotifications] = useState<NotificationResponse[]>(cachedNotes ?? []);
  const [userName, setUserName] = useState<string>(() => getUser()?.fullName || "User");

  useEffect(() => {
    if (forceLoading) return;
    if (forceDemo) {
      setHasResolved(true);
      return;
    }

    const cachedUser = getUser();
    if (cachedUser?.fullName) {
      setUserName(cachedUser.fullName);
    }

    let isMounted = true;
    async function loadData() {
      try {
        const [userPools, userNotes, me] = await Promise.all([
          api.getPools({ forceFresh: true }).catch(() => [] as PoolResponse[]),
          api.getNotifications().catch(() => [] as NotificationResponse[]),
          api.getMe().catch(() => null),
        ]);

        if (!isMounted) return;
        const validPools = Array.isArray(userPools) ? userPools : [];
        setPools(validPools);
        setNotifications(Array.isArray(userNotes) ? userNotes : []);
        if (me?.fullName) {
          setUserName(me.fullName);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setHasResolved(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [forceDemo, forceLoading]);

  if (forceLoading || !hasResolved) return <DashboardSkeleton />;
  if (forceDemo) return <PopulatedDashboard userName={userName} />;
  if (pools.length > 0) {
    return <PopulatedDashboard userName={userName} pools={pools} notifications={notifications} />;
  }
  return <EmptyDashboard />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
