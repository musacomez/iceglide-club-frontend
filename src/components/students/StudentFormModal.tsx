'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useLookups } from '@/lib/useLookups';
import { toISODate } from '@/lib/utils/date';
import type { StudentDetail, StudentInput } from '@/types/api';
import { PersonLinkPicker } from './PersonLinkPicker';

type Errors = Partial<Record<'full_name' | 'email' | 'birth_date', string>>;

const STATUS_OPTIONS: { value: 'active' | 'inactive' | 'frozen'; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
  { value: 'frozen', label: 'Dondurulmuş' },
];

function primaryFirst<T extends { is_primary: number }>(rows: T[], idOf: (r: T) => number): number[] {
  return [...rows].sort((a, b) => b.is_primary - a.is_primary).map(idOf);
}

export function StudentFormModal({
  detail,
  onClose,
  onSaved,
}: {
  /** Verilirse düzenleme modu, verilmezse yeni öğrenci. */
  detail?: StudentDetail;
  onClose: () => void;
  onSaved: (studentId: number) => void;
}) {
  const { push } = useToast();
  const { data: lookups, error: lookupError } = useLookups();
  const editing = !!detail;
  const s = detail?.student;

  const [fullName, setFullName] = useState(String(s?.full_name ?? ''));
  const [birthDate, setBirthDate] = useState(String(s?.birth_date ?? ''));
  const [phone, setPhone] = useState(String(s?.phone ?? ''));
  const [email, setEmail] = useState(String(s?.email ?? ''));
  const [registrationDate, setRegistrationDate] = useState(String(s?.registration_date ?? toISODate(new Date())));
  const [status, setStatus] = useState<'active' | 'inactive' | 'frozen'>(
    (['active', 'inactive', 'frozen'].includes(String(s?.status)) ? s?.status : 'active') as 'active' | 'inactive' | 'frozen',
  );
  const [levelId, setLevelId] = useState<string>(s?.current_level_id ? String(s.current_level_id) : '');
  const [groupId, setGroupId] = useState<string>(s?.current_group_id ? String(s.current_group_id) : '');
  const [instructorIds, setInstructorIds] = useState<number[]>(
    detail ? primaryFirst(detail.instructors, (i) => i.instructor_user_id) : [],
  );
  const [parentIds, setParentIds] = useState<number[]>(
    detail ? primaryFirst(detail.parents, (p) => p.parent_user_id) : [],
  );

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!fullName.trim()) next.full_name = 'Ad soyad zorunludur.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Geçerli bir e-posta girin.';
    if (birthDate && birthDate > toISODate(new Date())) next.birth_date = 'Doğum tarihi gelecekte olamaz.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (allowDuplicate = false) => {
    if (!validate()) return;
    setSaving(true);

    const payload: StudentInput = {
      full_name: fullName.trim(),
      birth_date: birthDate || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      registration_date: registrationDate || null,
      level_id: levelId ? Number(levelId) : null,
      group_id: groupId ? Number(groupId) : null,
      instructor_user_ids: instructorIds,
      parent_user_ids: parentIds,
    };
    if (editing) payload.status = status;
    if (allowDuplicate) payload.allow_duplicate = true;

    try {
      if (editing && detail) {
        const id = Number(detail.student.id);
        await api.updateStudent(id, payload);
        push('Öğrenci bilgileri güncellendi.', 'success');
        onSaved(id);
      } else {
        const created = await api.createStudent(payload);
        push('Öğrenci eklendi.', 'success');
        onSaved(created.id);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicate(true);
      } else {
        push(err instanceof ApiError ? err.message : 'Kayıt sırasında bir hata oluştu.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? 'Öğrenci Bilgilerini Düzenle' : 'Yeni Öğrenci'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button onClick={() => submit(false)} loading={saving}>
            {editing ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Ekle'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {duplicate && (
          <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p>Aynı ad ve doğum tarihine sahip bir öğrenci zaten kayıtlı.</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDuplicate(false)}>
                Bilgileri düzelt
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setDuplicate(false);
                  void submit(true);
                }}
              >
                Yine de ekle
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ad soyad *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.full_name}
              autoFocus
            />
          </div>
          <Input
            label="Doğum tarihi"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={errors.birth_date}
          />
          <Input
            label="Kayıt tarihi"
            type="date"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
          />
          <Input label="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input
            label="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          {editing && (
            <Select label="Durum" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </div>

        {lookupError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{lookupError}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Seviye" value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={!lookups}>
            <option value="">Seviye yok</option>
            {lookups?.levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Select label="Grup" value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={!lookups}>
            <option value="">Grup yok</option>
            {lookups?.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>

        <PersonLinkPicker
          label="Eğitmenler"
          options={lookups?.instructors ?? []}
          selected={instructorIds}
          onChange={setInstructorIds}
          emptyText="Tanımlı eğitmen bulunamadı."
        />
        <PersonLinkPicker
          label="Veliler"
          options={lookups?.parents ?? []}
          selected={parentIds}
          onChange={setParentIds}
          emptyText="Tanımlı veli hesabı bulunamadı. Veli hesabı oluşturulduktan sonra buradan bağlanabilir."
        />
      </div>
    </Modal>
  );
}
