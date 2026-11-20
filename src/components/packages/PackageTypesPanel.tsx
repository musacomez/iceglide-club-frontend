'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { formatCurrency, parseLiraToCents } from '@/lib/utils/format';
import type { ManagedPackageType } from '@/types/api';

function PackageTypeForm({ item, onClose, onSaved }: {
  item: ManagedPackageType | null; onClose: () => void; onSaved: () => void;
}) {
  const [lessons, setLessons] = useState(item?.lesson_count.toString() ?? '');
  const [weekly, setWeekly] = useState(item?.lessons_per_week?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const weeks = Number(weekly) > 0 ? Math.ceil(Number(lessons) / Number(weekly)) : 0;
  const { push } = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const price = parseLiraToCents(String(data.get('price')));
    if (price === null) { setError('Fiyatı 1500 veya 1500,50 biçiminde gir.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.savePackageType({
        name: String(data.get('name')),
        lesson_count: Number(lessons),
        lessons_per_week: Number(weekly),
        price_cents: price,
        active: data.get('active') === '1' ? 1 : 0,
      }, item?.id);
      push('Paket şablonu kaydedildi.', 'success');
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Paket şablonu kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={item ? 'Paket Şablonunu Düzenle' : 'Yeni Paket Şablonu'} onClose={() => { if (!saving) onClose(); }}>
      <form onSubmit={submit} className="space-y-4">
        <Input name="name" label="Paket adı" required maxLength={120} defaultValue={item?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input name="total-lessons" label="Toplam ders" type="number" min={1} required
            value={lessons} onChange={(event) => setLessons(event.target.value)} />
          <Input name="weekly-lessons" label="Haftada ders" type="number" min={1} required
            value={weekly} onChange={(event) => setWeekly(event.target.value)} />
        </div>
        {weeks > 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          Paket süresi <strong>{weeks} hafta ({weeks * 7} gün)</strong>
        </p>}
        <Input name="price" label="Fiyat (TL)" inputMode="decimal" required
          defaultValue={item ? (item.price_cents / 100).toFixed(2).replace('.', ',') : ''} placeholder="1500,00" />
        <Select name="active" label="Durum" defaultValue={String(item?.active ?? 1)}>
          <option value="1">Aktif</option>
          <option value="0">Pasif</option>
        </Select>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" loading={saving}>Kaydet</Button>
        </div>
      </form>
    </Modal>
  );
}

export function PackageTypesPanel() {
  const [items, setItems] = useState<ManagedPackageType[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ManagedPackageType | 'new' | null>(null);
  const load = useCallback(async () => {
    try { setError(''); setItems(await api.listManagedPackageTypes()); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Paket şablonları yüklenemedi.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <Card>
      <CardHeader title="Paket Şablonları" subtitle="Fiyatı, toplam ders hakkını ve haftalık sıklığı belirle."
        action={<Button type="button" size="sm" onClick={() => setEditing('new')}>Yeni Paket</Button>} />
      {error ? <ErrorState message={error} onRetry={load} /> : !items ? <SkeletonRows rows={2} /> : (
        <div className="divide-y divide-slate-100">
          {items.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">Henüz paket şablonu yok.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name} {!item.active && <span className="font-normal text-slate-500">· Pasif</span>}</p>
                <p className="text-xs text-slate-600">
                  {item.lesson_count} ders · {item.lessons_per_week ? `haftada ${item.lessons_per_week} ders · ` : ''}
                  {formatCurrency(item.price_cents / 100)}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(item)}>Düzenle</Button>
            </div>
          ))}
        </div>
      )}
      {editing && <PackageTypeForm item={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
    </Card>
  );
}
