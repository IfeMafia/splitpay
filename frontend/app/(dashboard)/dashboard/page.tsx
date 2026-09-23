"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import EmptyDashboard from "../_components/EmptyDashboard";
import PopulatedDashboard from "../_components/PopulatedDashboard";
import DashboardSkeleton from "../_components/DashboardSkeleton";

function DashboardContent() {
  const params = useSearchParams();
  const demo = params.get("demo");
  const loading = params.get("loading");

  if (loading) return <DashboardSkeleton />;
  if (demo) return <PopulatedDashboard userName="Abraham" />;
  return <EmptyDashboard />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
