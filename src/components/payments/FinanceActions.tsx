'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { toISODate } from '@/lib/utils/date';
import { formatCurrency, parseLiraToCents } from '@/lib/utils/format';
import type { ManualChargeType, StudentCharge } from '@/types/api';

export type FinanceAction = { kind: 'charge' } | { kind: 'receive' | 'cancel'; charge: StudentCharge };

export function FinanceActions({ studentId, action, onClose, onSaved }: {
  studentId: number; action: FinanceAction; onClose: () => void; onSaved: (message: string) => void;
}) {
  const [chargeType, setChargeType] = useState<ManualChargeType>('monthly_due');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const request = useRef<{ key: string; id: string } | null>(null);
  const today = toISODate(new Date());
  const title = { charge: 'Borç Ekle', receive: 'Tahsilat Kaydet', cancel: 'Borcu İptal Et' }[action.kind];

  function requestId(fields: unknown) {
    const key = JSON.stringify(fields);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    return request.current.id;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;

    const data = new FormData(event.currentTarget);
    const amount = parseLiraToCents(String(data.get('amount') ?? ''));
    if (action.kind !== 'cancel' && (!amount || (action.kind === 'receive' && amount > action.charge.balance_cents))) {
      setError('Geçerli bir tutar gir. Tahsilat kalan borcu aşamaz.');
      return;
    }

    pending.current = true;
    setSaving(true);
    setError('');
    try {
      if (action.kind === 'cancel') {
        await api.cancelCharge(studentId, action.charge.id);
        onSaved('Borç iptal edildi.');
      } else if (action.kind === 'charge') {
        const fields = {
          charge_type: chargeType,
          description: String(data.get('description')),
          amount_cents: amount!,
          due_date: String(data.get('date')),
          period_start: chargeType === 'monthly_due' ? `${data.get('period')}-01` : null,
        };
        await api.createCharge(studentId, { ...fields, request_id: requestId(fields) });
        onSaved('Öğrenci borcu kaydedildi.');
      } else {
        const fields = {
          amount_cents: amount!, description: String(data.get('description') ?? ''),
          payment_date: String(data.get('date')),
          payment_method: data.get('method') === 'bank_transfer' ? 'bank_transfer' as const : 'cash' as const,
        };
        await api.receivePayment(studentId, action.charge.id, { ...fields, request_id: requestId(fields) });
        onSaved('Tahsilat kaydedildi.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'İşlem kaydedilemedi.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open title={title} onClose={() => { if (!pending.current) onClose(); }}>
      <form className="space-y-4" onSubmit={save} aria-busy={saving}>
        {action.kind === 'charge' && (
          <>
            <Select name="charge-type" label="Borç türü" value={chargeType}
              onChange={(event) => setChargeType(event.target.value === 'private_lesson' ? 'private_lesson' : 'monthly_due')}>
              <option value="monthly_due">Aylık aidat</option><option value="private_lesson">Özel ders</option>
            </Select>
            {chargeType === 'monthly_due' && <Input name="period" label="Aidat dönemi" type="month" defaultValue={today.slice(0, 7)} required />}
          </>
        )}
        {action.kind === 'receive' && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">{action.charge.description}</p>
            <p>Kalan borç {formatCurrency(action.charge.balance_cents / 100)}</p>
          </div>
        )}
        {action.kind === 'cancel' ? (
          <p className="text-sm text-slate-700">“{action.charge.description}” açık bakiyeden çıkarılacak. İptal edilen kayıt geçmişte görünmeye devam edecek.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input name="amount" label="Tutar (TL)" inputMode="decimal" required placeholder="1500,00"
                defaultValue={action.kind === 'receive' ? (action.charge.balance_cents / 100).toFixed(2).replace('.', ',') : ''} />
              <Input name="date" label={action.kind === 'charge' ? 'Vade' : 'Ödeme tarihi'} type="date" defaultValue={today} required />
            </div>
            {action.kind === 'receive' && <Select name="method" label="Ödeme yöntemi">
              <option value="cash">Nakit</option><option value="bank_transfer">Havale</option>
            </Select>}
            <Input name="description" label="Açıklama" required={action.kind === 'charge'} maxLength={180} />
          </>
        )}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant={action.kind === 'cancel' ? 'danger' : 'primary'} loading={saving}>
            {action.kind === 'cancel' ? 'Borcu İptal Et' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
