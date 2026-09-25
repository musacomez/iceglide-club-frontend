'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { PaymentItem } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export function PaymentsList({ studentId, title = 'Ödemeler' }: { studentId: number; title?: string }) {
  const [rows, setRows] = useState<PaymentItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.listStudentPayments(studentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ödemeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = (rows ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={rows && rows.length > 0 ? `Toplam: ${formatCurrency(total)}` : undefined}
      />
      {loading && <SkeletonRows rows={3} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (!rows || rows.length === 0) && (
        <EmptyState title="Ödeme bulunamadı" description="Bu öğrenciye ait kayıtlı ödeme yok." />
      )}
      {!loading && !error && rows && rows.length > 0 && (
        <div className="divide-y divide-slate-100">
          {rows.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-slate-500">{formatDate(p.payment_date)}{p.package_number ? ` · ${p.package_number}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
