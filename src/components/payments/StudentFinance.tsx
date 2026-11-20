'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { toISODate } from '@/lib/utils/date';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { StudentCharge } from '@/types/api';
import { FinanceActions, type FinanceAction } from './FinanceActions';
import { PaymentsList } from './PaymentsList';

const LABELS = { package: 'Paket', monthly_due: 'Aidat', private_lesson: 'Özel ders' };

export function StudentFinance({ studentId, studentName }: { studentId: number; studentName: string }) {
  const [charges, setCharges] = useState<StudentCharge[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [action, setAction] = useState<FinanceAction | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setCharges(await api.listCharges(studentId)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Borçlar yüklenemedi.'); }
    finally { setLoading(false); }
  }, [studentId]);
  useEffect(() => { void load(); }, [load]);

  const active = (charges ?? []).filter((charge) => charge.status === 'active');
  const balance = active.reduce((sum, charge) => sum + charge.balance_cents, 0);
  const paid = active.reduce((sum, charge) => sum + charge.paid_cents, 0);
  const today = toISODate(new Date());
  const visible = (charges ?? []).filter((charge) => {
    if (filter === 'all') return true;
    if (filter === 'cancelled') return charge.status === 'cancelled';
    if (filter === 'overdue') return charge.status === 'active' && charge.balance_cents > 0 &&
      charge.due_date !== null && charge.due_date < today;
    return charge.status === 'active' && (filter === 'open' ? charge.balance_cents > 0 : charge.balance_cents === 0);
  });

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardHeader title={studentName} subtitle="Borç ve tahsilat"
          action={<Button type="button" size="sm" onClick={() => setAction({ kind: 'charge' })}>Borç Ekle</Button>} />
      </Card>
      {charges && !error && <div className="grid grid-cols-2 gap-3">
        <StatCard label="Kalan borç" value={formatCurrency(balance / 100)} tone={balance ? 'warning' : 'default'} />
        <StatCard label="Borçlara işlenen tahsilat" value={formatCurrency(paid / 100)} />
      </div>}
      <Card>
        <CardHeader title="Öğrenci Borçları" action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select aria-label="Borç durumu" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="open">Açık borçlar</option><option value="overdue">Vadesi geçenler</option>
              <option value="paid">Ödenenler</option>
              <option value="cancelled">İptal edilenler</option><option value="all">Tümü</option>
            </Select>
            <Button type="button" size="sm" variant="outline" disabled={loading}
              onClick={() => { void load(); setHistoryVersion((v) => v + 1); }}>Yenile</Button>
          </div>
        } />
        {loading ? <SkeletonRows rows={3} /> : error ? <ErrorState message={error} onRetry={load} /> :
          visible.length === 0 ? <EmptyState title="Bu filtreye uygun borç yok" /> : (
            <div className="divide-y divide-slate-100">
              {visible.map((charge) => (
                <div key={charge.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{charge.description}</p>
                    <p className="text-xs text-slate-600">
                      {LABELS[charge.charge_type]} · Vade {formatDate(charge.due_date)}
                      {charge.status === 'cancelled' && ' · İptal edildi'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-2">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(charge.amount_cents / 100)}</p>
                      {charge.status === 'active' && <p className="text-xs text-slate-600">Kalan {formatCurrency(charge.balance_cents / 100)}</p>}
                    </div>
                    {charge.status === 'active' && charge.balance_cents > 0 &&
                      <Button type="button" size="sm" onClick={() => setAction({ kind: 'receive', charge })}>Tahsilat Kaydet</Button>}
                    {charge.status === 'active' && charge.paid_cents === 0 && charge.charge_type !== 'package' &&
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAction({ kind: 'cancel', charge })}>Borcu İptal Et</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>
      <PaymentsList key={historyVersion} studentId={studentId} title="Tahsilat Geçmişi" />
      {action && <FinanceActions studentId={studentId} action={action} onClose={() => setAction(null)}
        onSaved={(message) => { setAction(null); push(message, 'success'); void load(); setHistoryVersion((v) => v + 1); }} />}
    </div>
  );
}
