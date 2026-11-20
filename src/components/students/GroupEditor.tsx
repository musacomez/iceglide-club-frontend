'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { useLookups } from '@/lib/useLookups';
import type { StudentListItem } from '@/types/api';

export function GroupEditor({ student, onClose, onSaved }: {
  student?: StudentListItem; onClose: () => void; onSaved: () => void;
}) {
  const { data, error: loadError, reload } = useLookups();
  const { push } = useToast();
  const [groupId, setGroupId] = useState(student?.current_group_id?.toString() ?? '');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (student) await api.updateStudent(student.id, { group_id: groupId ? Number(groupId) : null });
      else {
        await api.saveGroup(name, groupId ? Number(groupId) : undefined);
        await reload();
      }
      push(student ? 'Öğrencinin grubu güncellendi.' : 'Grup kaydedildi.', 'success');
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Grup kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={student ? `${student.full_name} · Grubu Düzenle` : 'Grupları Yönet'}
      onClose={() => { if (!saving) onClose(); }}>
      <form className="space-y-4" onSubmit={save}>
        <Select name="edit-group" label={student ? 'Öğrencinin grubu' : 'Grup'} value={groupId}
          disabled={!data || saving}
          onChange={(event) => {
            const id = event.target.value;
            setGroupId(id);
            setName(data?.groups.find((group) => String(group.id) === id)?.name ?? '');
          }}>
          <option value="">{student ? 'Grupsuz' : 'Yeni grup oluştur'}</option>
          {data?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </Select>
        {!student && <Input name="group-name" label="Grup adı" value={name} required maxLength={100}
          onChange={(event) => setName(event.target.value)} />}
        {(error || loadError) && <p role="alert" className="text-sm text-rose-700">{error || loadError}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" loading={saving} disabled={!data}>Kaydet</Button>
        </div>
      </form>
    </Modal>
  );
}
