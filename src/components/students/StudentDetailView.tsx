'use client';

import { useEffect, useState, useCallback } from 'react';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PackagesList } from '@/components/packages/PackagesList';
import { PaymentsList } from '@/components/payments/PaymentsList';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { StudentDetail } from '@/types/api';
import { formatDate, initials } from '@/lib/utils/format';

export function StudentDetailView({ studentId, showPayments = true }: { studentId: number; showPayments?: boolean }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await api.getStudent(studentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Öğrenci bilgisi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SkeletonRows rows={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return null;

  const s = detail.student;

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-800">
            {initials(String(s.full_name))}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{String(s.full_name)}</h2>
              <Badge tone={s.status === 'active' ? 'green' : 'slate'}>{s.status === 'active' ? 'Aktif' : String(s.status)}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {s.current_level ? `${s.current_level} · ` : ''}
              {s.current_group ?? 'Gruba atanmadı'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
          <Field label="Telefon" value={(s.phone as string) ?? '-'} />
          <Field label="E-posta" value={(s.email as string) ?? '-'} />
          <Field label="Doğum tarihi" value={formatDate(s.birth_date as string | null)} />
          <Field label="Kayıt tarihi" value={formatDate(s.registration_date as string | null)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Veliler" />
          {detail.parents.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">Kayıtlı veli yok.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {detail.parents.map((p) => (
                <div key={p.parent_user_id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.full_name}</p>
                    <p className="text-xs text-slate-500">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                  </div>
                  {p.is_primary === 1 && <Badge tone="blue">Birincil</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Eğitmenler" />
          {detail.instructors.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">Atanmış eğitmen yok.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {detail.instructors.map((ins) => (
                <div key={ins.instructor_user_id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ins.full_name}</p>
                    <p className="text-xs text-slate-500">{ins.email}</p>
                  </div>
                  {ins.is_primary === 1 && <Badge tone="blue">Birincil</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <PackagesList studentId={studentId} />
      {showPayments && <PaymentsList studentId={studentId} />}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
