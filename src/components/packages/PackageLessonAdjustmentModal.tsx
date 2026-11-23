'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import type { PackageItem } from '@/types/api';

export function PackageLessonAdjustmentModal({ studentId, pack, onClose, onSaved }: {
  studentId: number;
  pack: PackageItem;
  onClose: (refresh: boolean) => void;
  onSaved: () => void;
}) {
  const [operation, setOperation] = useState('add');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const pending = useRef(false);
  const requests = useRef(new Map<string, string>());

  const count = Number(quantity);
  const delta = operation === 'remove' ? -count : count;
  const remaining = pack.remaining_lessons + delta;
  const validQuantity = Number.isSafeInteger(count) && count > 0 && Number.isSafeInteger(remaining) && remaining >= 0;

  function close() {
    if (!pending.current) onClose(needsRefresh);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const explanation = reason.trim();
    if (pending.current || needsRefresh || !validQuantity || !explanation) return;

    const key = JSON.stringify([delta, explanation]);
    const requestId = requests.current.get(key) ?? crypto.randomUUID();
    requests.current.set(key, requestId);
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      await api.adjustPackageLessons(studentId, pack.id, {
        quantity_delta: delta,
        expected_remaining_lessons: pack.remaining_lessons,
        reason: explanation,
        request_id: requestId,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ders hakkı güncellenemedi.');
      setNeedsRefresh(err instanceof ApiError && err.status === 409);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={close} title="Ders Hakkını Düzenle">
      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={saving}>
        <p className="text-sm text-slate-700">
          {pack.package_type_name} · {pack.package_number || `Paket #${pack.id}`} · Kalan ders: {pack.remaining_lessons}
        </p>
        <Select name="lesson-adjustment-operation" label="İşlem" value={operation} disabled={saving}
          onChange={(event) => setOperation(event.target.value)}>
          <option value="add">Ders hakkı ekle</option>
          {pack.remaining_lessons > 0 && <option value="remove">Ders hakkı düş</option>}
        </Select>
        <Input name="lesson-adjustment-quantity" type="number" label="Ders adedi" required min={1} step={1}
          max={operation === 'remove' ? pack.remaining_lessons : undefined} value={quantity} readOnly={saving}
          onChange={(event) => setQuantity(event.target.value)} />
        <Textarea name="lesson-adjustment-reason" label="İşlem açıklaması" value={reason} required maxLength={180}
          readOnly={saving} onChange={(event) => setReason(event.target.value)} />
        <p className="text-sm text-slate-700" aria-live="polite">
          {validQuantity ? `İşlem sonrası kalan ders: ${remaining}` : 'Geçerli bir ders adedi girin.'}
        </p>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={close}>
            {needsRefresh ? 'Kapat ve Yenile' : 'Vazgeç'}
          </Button>
          <Button type="submit" loading={saving} disabled={needsRefresh || !validQuantity || !reason.trim()}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
