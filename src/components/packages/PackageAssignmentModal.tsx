'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { toISODate } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/format';
import type { PackageTypeOption } from '@/types/api';

export function PackageAssignmentModal({
  studentId, onClose, onSaved,
}: { studentId: number; onClose: () => void; onSaved: (chargeId: number | null) => void }) {
  const [types, setTypes] = useState<PackageTypeOption[] | null>(null);
  const [typeId, setTypeId] = useState('');
  const [startsAt, setStartsAt] = useState(() => toISODate(new Date()));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const request = useRef<{ key: string; id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.listPackageTypes().then(
      (options) => { if (!cancelled) setTypes(options); },
      (err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Paket türleri yüklenemedi.');
      },
    );
    return () => { cancelled = true; };
  }, []);

  const selected = types?.find((option) => String(option.id) === typeId);

  function close() {
    if (!pending.current) onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || pending.current) return;

    const key = JSON.stringify([studentId, selected.id, startsAt, selected.price_cents,
      selected.lesson_count, selected.validity_days]);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };

    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const result = await api.assignStudentPackage(studentId, {
        package_type_id: selected.id,
        starts_at: startsAt,
        request_id: request.current.id,
        expected_price_cents: selected.price_cents,
        expected_lesson_count: selected.lesson_count,
        expected_validity_days: selected.validity_days,
      });
      onSaved(result.charge_id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Paket atanamadı.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={close} title="Paket Ata">
      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={saving}>
        <Select name="package-type" label="Paket türü" required value={typeId}
          disabled={!types?.length || saving} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">{types ? 'Paket türü seçin' : error ? 'Paket türleri yüklenemedi' : 'Yükleniyor…'}</option>
          {types?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </Select>
        {types?.length === 0 && <p className="text-sm text-slate-600">Atanabilecek aktif paket türü bulunamadı.</p>}
        <Input name="package-start" type="date" label="Başlangıç tarihi" required value={startsAt}
          readOnly={saving} onChange={(e) => setStartsAt(e.target.value)} />
        {selected && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {selected.lesson_count} ders · {selected.validity_days ? `${selected.validity_days} gün` : 'Süresiz'}
            <p className="mt-1 font-medium">
              {selected.price_cents ? `Oluşacak borç: ${formatCurrency(selected.price_cents / 100)}` : 'Ücretsiz paket'}
            </p>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={close}>Vazgeç</Button>
          <Button type="submit" disabled={!selected || !startsAt} loading={saving}>Paketi Ata</Button>
        </div>
      </form>
    </Modal>
  );
}
