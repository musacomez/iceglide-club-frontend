'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/ui/Card';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { DashboardSummary } from '@/types/api';

// Used by both admin and head_coach - the Worker exposes the exact same
// GET /api/dashboard/summary to both roles (see withRoles(['admin','head_coach'])
// in src/index.ts), so there is nothing role-specific to differentiate here.
export function ManagementDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.dashboardSummary());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Panel verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SkeletonCards count={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard label="Aktif Öğrenci" value={summary.active_students} />
      <StatCard label="Bugünkü Dersler" value={summary.today_lessons} />
      <StatCard
        label="Bekleyen Ders Talepleri"
        value={summary.pending_private_lesson_requests}
        tone={summary.pending_private_lesson_requests > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label="Tükenen Paketler"
        value={summary.exhausted_packages}
        tone={summary.exhausted_packages > 0 ? 'danger' : 'default'}
      />
      <StatCard
        label="Azalan Paketler (1-2 ders)"
        value={summary.low_packages}
        tone={summary.low_packages > 0 ? 'warning' : 'default'}
        hint="Yenileme için iletişime geçilebilir"
      />
    </div>
  );
}
