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
import { PackageLessonAdjustmentModal } from './PackageLessonAdjustmentModal';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { PackageItem } from '@/types/api';
import { formatDate } from '@/lib/utils/format';

function packageDisplayStatus(pack: PackageItem, today: string) {
  if (pack.status !== 'active') return pack.status;
  if (pack.remaining_lessons <= 0) return 'completed';
  if (pack.expires_at && pack.expires_at.slice(0, 10) < today) return 'expired';
  return 'active';
}

export function PackagesList({
  studentId, title = 'Paketler', canAssign = false, canAdjustLessons = false,
}: { studentId: number; title?: string; canAssign?: boolean; canAdjustLessons?: boolean }) {
  const { push } = useToast();
  const [assigning, setAssigning] = useState(false);
  const [adjusting, setAdjusting] = useState<PackageItem | null>(null);
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
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
  const current: PackageItem[] = [];
  const history: PackageItem[] = [];
  for (const pack of rows ?? []) {
    const status = packageDisplayStatus(pack, today);
    if (pack.remaining_lessons <= 0 || ['completed', 'expired', 'cancelled'].includes(status)) {
      history.push(pack);
    } else {
      current.push(pack);
    }
  }
  const sections = [
    { title: 'Güncel Paketler', packages: current, empty: 'Güncel paket yok.' },
    { title: 'Geçmiş Paket Kullanımları', packages: history, empty: 'Geçmiş paket kaydı yok.' },
  ];

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
        <div className="divide-y divide-slate-200">
          {sections.map((section) => (
            <section key={section.title} aria-label={section.title}>
              <h3 className="bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800">{section.title}</h3>
              {section.packages.length === 0 && (
                <p className="px-5 py-4 text-sm text-slate-500">{section.empty}</p>
              )}
              <div className="divide-y divide-slate-100">
                {section.packages.map((p) => {
                  const totalLessons = p.total_lessons || p.package_type_lesson_count;
                  const packageNumber = p.package_number || `Paket #${p.id}`;
                  const mayAdjust = canAdjustLessons && p.status === 'active' &&
                    (!p.expires_at || p.expires_at.slice(0, 10) >= today);
                  const action = p.remaining_lessons === 0 ? 'Ders Hakkı Ekle' : 'Ders Hakkını Düzenle';
                  return (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.package_type_name}</p>
                        <p className="text-xs text-slate-500">
                          {packageNumber} · Satın alma: {formatDate(p.purchased_at)}
                          {p.expires_at ? ` · Bitiş: ${formatDate(p.expires_at)}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{p.remaining_lessons} ders kaldı</p>
                          {typeof totalLessons === 'number' && totalLessons > 0 && (
                            <p className="text-xs text-slate-400">
                              {canAdjustLessons ? `Paket kapsamı: ${totalLessons} ders` : `/ ${totalLessons} toplam`}
                            </p>
                          )}
                        </div>
                        <PackageStatusBadge status={packageDisplayStatus(p, today)} />
                        {mayAdjust && (
                          <Button type="button" size="sm" variant="secondary" onClick={() => setAdjusting(p)}
                            aria-label={`${p.package_type_name}, ${packageNumber} - ${action}`}>
                            {action}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
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
      {canAdjustLessons && adjusting && (
        <PackageLessonAdjustmentModal
          studentId={studentId}
          pack={adjusting}
          onClose={(refreshAfterClose) => {
            setAdjusting(null);
            if (refreshAfterClose) refresh();
          }}
          onSaved={() => {
            setAdjusting(null);
            push('Ders hakkı güncellendi.', 'success');
            refresh();
          }}
        />
      )}
    </Card>
  );
}
