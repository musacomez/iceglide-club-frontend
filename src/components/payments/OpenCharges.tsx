'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api/endpoints';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { StudentCharge } from '@/types/api';

export function OpenCharges() {
  const [rows, setRows] = useState<StudentCharge[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await api.listOwnOpenCharges());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Borçlar yüklenemedi.');
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    api.listOwnOpenCharges().then(
      (result) => { if (mounted) setRows(result); },
      (err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Borçlar yüklenemedi.');
      },
    );
    return () => { mounted = false; };
  }, []);

  return (
    <Card>
      <CardHeader title="Açık Ödemeler" />
      {error ? <ErrorState message={error} onRetry={load} /> : (
        <div className="divide-y divide-slate-100 px-4 sm:px-5">
          {!rows && <p role="status" className="py-4 text-sm">Ödemeler yükleniyor…</p>}
          {rows?.length === 0 && <p className="py-4 text-sm text-slate-600">Açık ödemen yok.</p>}
          {rows?.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="break-words font-medium">{row.description}</p>
                <p className="text-sm text-slate-600">{row.due_date ? `Son ödeme ${formatDate(row.due_date)}` : 'Vade belirtilmedi'}</p>
              </div>
              <p className="font-semibold">{formatCurrency(row.balance_cents / 100)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
