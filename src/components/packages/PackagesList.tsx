'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PackageStatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { PackageItem } from '@/types/api';
import { formatDate } from '@/lib/utils/format';

export function PackagesList({ studentId, title = 'Paketler' }: { studentId: number; title?: string }) {
  const [rows, setRows] = useState<PackageItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.listStudentPackages(studentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Paketler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader title={title} subtitle="Satın alınan paketler ve kalan ders hakları" />
      {loading && <SkeletonRows rows={3} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (!rows || rows.length === 0) && (
        <EmptyState title="Paket bulunamadı" description="Bu öğrenciye ait kayıtlı paket yok." />
      )}
      {!loading && !error && rows && rows.length > 0 && (
        <div className="divide-y divide-slate-100">
          {rows.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{p.package_type_name}</p>
                <p className="text-xs text-slate-500">
                  {p.package_number ? `${p.package_number} · ` : ''}Satın alma: {formatDate(p.purchased_at)}
                  {p.expires_at ? ` · Bitiş: ${formatDate(p.expires_at)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{p.remaining_lessons} ders kaldı</p>
                  {typeof p.package_type_lesson_count === 'number' && (
                    <p className="text-xs text-slate-400">/ {p.package_type_lesson_count} toplam</p>
                  )}
                </div>
                <PackageStatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
