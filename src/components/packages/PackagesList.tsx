'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PackageStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PackageAssignmentModal } from './PackageAssignmentModal';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { PackageItem } from '@/types/api';
import { formatDate } from '@/lib/utils/format';

export function PackagesList({
  studentId, title = 'Paketler', canAssign = false,
}: { studentId: number; title?: string; canAssign?: boolean }) {
  const { push } = useToast();
  const [assigning, setAssigning] = useState(false);
  const [rows, setRows] = useState<PackageItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedStudentId, setLoadedStudentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.listStudentPackages(studentId));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Paketler yüklenemedi.');
    } finally {
      setLoadedStudentId(studentId);
      setLoading(false);
    }
  }, [studentId]);

  const refresh = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    api.listStudentPackages(studentId).then(
      (result) => {
        if (cancelled) return;
        setRows(result);
        setError(null);
        setLoadedStudentId(studentId);
        setLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Paketler yüklenemedi.');
        setLoadedStudentId(studentId);
        setLoading(false);
      },
    );
    return () => { cancelled = true; };
  }, [studentId]);

  const isLoading = loading || loadedStudentId !== studentId;

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle="Atanan paketler ve kalan ders hakları"
        action={canAssign && (
          <Button type="button" size="sm" className="shrink-0" onClick={() => setAssigning(true)}>Paket Ata</Button>
        )}
      />
      {isLoading && <SkeletonRows rows={3} />}
      {!isLoading && error && <ErrorState message={error} onRetry={refresh} />}
      {!isLoading && !error && (!rows || rows.length === 0) && (
        <EmptyState title="Paket bulunamadı" description="Bu öğrenciye ait kayıtlı paket yok." />
      )}
      {!isLoading && !error && rows && rows.length > 0 && (
        <div className="divide-y divide-slate-100">
          {rows.map((p) => {
            const totalLessons = p.total_lessons || p.package_type_lesson_count;
            return (
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
                    {typeof totalLessons === 'number' && totalLessons > 0 && (
                      <p className="text-xs text-slate-400">/ {totalLessons} toplam</p>
                    )}
                  </div>
                  <PackageStatusBadge status={p.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {canAssign && assigning && (
        <PackageAssignmentModal
          studentId={studentId}
          onClose={() => setAssigning(false)}
          onSaved={(chargeId) => {
            setAssigning(false);
            push(chargeId === null ? 'Paket atandı.' : 'Paket atandı ve öğrenci borcu oluşturuldu.', 'success');
            refresh();
          }}
        />
      )}
    </Card>
  );
}
