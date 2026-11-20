'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/format';
import type { ManagedCoach } from '@/types/api';

function CoachForm({ coach, close, saved }: { coach: ManagedCoach | null; close: () => void; saved: () => Promise<void> }) {
  const [model, setModel] = useState(() => {
    if (coach?.commission_bps != null && coach.lesson_fee_cents != null) return 'both';
    if (coach?.commission_bps != null) return 'commission';
    if (coach?.lesson_fee_cents != null) return 'fixed';
    return 'none';
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const commission = model === 'commission' || model === 'both';
  const fixed = model === 'fixed' || model === 'both';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const text = (field: string) => String(data.get(field) ?? '').trim();
    setSaving(true);
    setError('');
    try {
      await api.saveCoach({
        full_name: text('coach-name'),
        email: text('coach-email'),
        phone: text('coach-phone') || null,
        active: data.get('coach-active') === 'on',
        commission_bps: commission ? Math.round(Number(text('coach-commission')) * 100) : null,
        lesson_fee_cents: fixed ? Math.round(Number(text('coach-fee')) * 100) : null,
        ...(!coach ? { password: String(data.get('coach-password') ?? '') } : {}),
      }, coach?.id);
      await saved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Antrenör kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={coach ? 'Antrenörü Düzenle' : 'Antrenör Ekle'} onClose={() => { if (!saving) close(); }}>
      <form onSubmit={submit} className="grid gap-4">
        <Input name="coach-name" label="Ad soyad" defaultValue={coach?.full_name} required maxLength={120} />
        <Input name="coach-email" label="E-posta" type="email" defaultValue={coach?.email} required maxLength={254} />
        <Input name="coach-phone" label="Telefon" type="tel" defaultValue={coach?.phone ?? ''} maxLength={40} />
        {!coach && <Input name="coach-password" label="Başlangıç parolası (en az 12 karakter)" type="password"
          autoComplete="new-password" required minLength={12} maxLength={128} />}
        <Select name="coach-model" label="Ücret modeli" value={model} onChange={(event) => setModel(event.target.value)}>
          <option value="none">Ücret tanımlanmadı</option>
          <option value="commission">Paket komisyonu</option>
          <option value="fixed">Ders başı sabit ücret</option>
          <option value="both">Sabit ücret + komisyon</option>
        </Select>
        {commission && <Input name="coach-commission" label="Komisyon (%)" type="number" min={0} max={100}
          step="0.01" required defaultValue={coach?.commission_bps == null ? '' : coach.commission_bps / 100} />}
        {fixed && <Input name="coach-fee" label="Ders başına ücret (TL)" type="number" min={0} step="0.01"
          required defaultValue={coach?.lesson_fee_cents == null ? '' : coach.lesson_fee_cents / 100} />}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="coach-active" type="checkbox" defaultChecked={coach?.active !== 0} /> Aktif
        </label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={close}>Vazgeç</Button>
          <Button type="submit" loading={saving}>Kaydet</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CoachesPage() {
  const [rows, setRows] = useState<ManagedCoach[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ coach: ManagedCoach | null } | null>(null);
  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await api.listCoaches());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Antrenörler yüklenemedi.');
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <RoleGuard role="admin" title="Antrenörler">
      <Card>
        <CardHeader title="Antrenörler" action={<Button type="button" onClick={() => setEditing({ coach: null })}>Antrenör Ekle</Button>} />
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && !rows && <p role="status" className="px-5 pb-5">Yükleniyor…</p>}
        {!error && rows?.length === 0 && <p className="px-5 pb-5 text-slate-600">Henüz antrenör yok.</p>}
        {!error && rows?.map((coach) => (
          <div key={coach.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <div className="min-w-0 break-words">
              <p className="font-semibold text-slate-900">{coach.full_name}</p>
              <p className="text-sm text-slate-600">{coach.email} · {coach.role === 'head_coach' ? 'Baş Antrenör' : 'Antrenör'} · {coach.active ? 'Aktif' : 'Pasif'}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-700">
                {coach.commission_bps !== null && <span>Komisyon %{coach.commission_bps / 100}</span>}
                {coach.lesson_fee_cents !== null && <span>Ders başı {formatCurrency(coach.lesson_fee_cents / 100)}</span>}
              </div>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing({ coach })}>Düzenle</Button>
          </div>
        ))}
      </Card>
      {editing && <CoachForm coach={editing.coach} close={() => setEditing(null)}
        saved={async () => { setEditing(null); await load(); }} />}
    </RoleGuard>
  );
}
