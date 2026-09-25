"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EmptyDashboard from "../_components/EmptyDashboard";
import PopulatedDashboard from "../_components/PopulatedDashboard";
import DashboardSkeleton from "../_components/DashboardSkeleton";
import { api } from "../../../lib/api";
import { getUser } from "../../lib/auth";
import { PoolResponse, NotificationResponse } from "../../../lib/contracts";

function DashboardContent() {
  const params = useSearchParams();
  const forceDemo = params.get("demo") === "1";
  const forceLoading = params.get("loading") === "1";

  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<PoolResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    if (forceLoading) return;
    if (forceDemo) {
      setLoading(false);
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
          api.getPools().catch(() => [] as PoolResponse[]),
          api.getNotifications().catch(() => [] as NotificationResponse[]),
          api.getMe().catch(() => null),
        ]);

        if (!isMounted) return;
        setPools(Array.isArray(userPools) ? userPools : []);
        setNotifications(Array.isArray(userNotes) ? userNotes : []);
        if (me?.fullName) {
          setUserName(me.fullName);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [forceDemo, forceLoading]);

  if (forceLoading || loading) return <DashboardSkeleton />;
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
