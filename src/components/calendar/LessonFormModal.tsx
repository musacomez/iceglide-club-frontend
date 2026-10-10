'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useLookups } from '@/lib/useLookups';
import { formatTime, timeToMinutes, toISODate } from '@/lib/utils/date';
import { formatDate } from '@/lib/utils/format';
import clsx from '@/lib/utils/clsx';
import type { LessonConflict, LessonDetail, LessonInput, StudentListItem } from '@/types/api';

const LESSON_TYPES: { value: string; label: string }[] = [
  { value: 'group', label: 'Grup dersi' },
  { value: 'private', label: 'Özel ders' },
];

const STATUS_OPTIONS: { value: 'scheduled' | 'completed' | 'cancelled'; label: string }[] = [
  { value: 'scheduled', label: 'Planlandı' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal edildi' },
];

export interface LessonPrefill {
  date: string;
  start: string;
  end: string;
}

type FieldErrors = Partial<Record<'title' | 'date' | 'time', string>>;

export function LessonFormModal({
  detail,
  prefill,
  onClose,
  onSaved,
}: {
  /** Verilirse düzenleme modu. */
  detail?: LessonDetail;
  /** Yeni derste takvimden gelen tarih/saat önerisi. */
  prefill?: LessonPrefill;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const { data: lookups, error: lookupError } = useLookups();
  const editing = !!detail;
  const l = detail?.lesson;

  const [title, setTitle] = useState(l?.title ?? '');
  const [lessonType, setLessonType] = useState(l?.lesson_type ?? 'group');
  const [date, setDate] = useState(l?.lesson_date ?? prefill?.date ?? toISODate(new Date()));
  const [start, setStart] = useState(l?.start_time ? formatTime(l.start_time) : (prefill?.start ?? '10:00'));
  const [end, setEnd] = useState(l?.end_time ? formatTime(l.end_time) : (prefill?.end ?? '11:00'));
  const [instructorId, setInstructorId] = useState(l?.instructor_user_id ? String(l.instructor_user_id) : '');
  const [locationId, setLocationId] = useState(l?.location_id ? String(l.location_id) : '');
  const [groupId, setGroupId] = useState(l?.group_id ? String(l.group_id) : '');
  const [notes, setNotes] = useState(l?.notes ?? '');
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'cancelled'>(
    (['scheduled', 'completed', 'cancelled'].includes(l?.status ?? '') ? l?.status : 'scheduled') as
      | 'scheduled'
      | 'completed'
      | 'cancelled',
  );
  const [cancelReason, setCancelReason] = useState(l?.cancellation_reason ?? '');
  const [repeat, setRepeat] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState('4');
  const [studentIds, setStudentIds] = useState<number[]>(detail ? detail.students.map((s) => s.id) : []);

  const [students, setStudents] = useState<StudentListItem[] | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [conflicts, setConflicts] = useState<LessonConflict[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listStudents({ status: 'active' })
      .then((rows) => {
        if (!cancelled) setStudents(rows);
      })
      .catch((err) => {
        if (!cancelled) setStudentsError(err instanceof ApiError ? err.message : 'Öğrenciler yüklenemedi.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dersteki öğrenci aktif listede yoksa (pasif vb.) yine de görünsün.
  const studentRows = useMemo(() => {
    const base = students ?? [];
    const known = new Set(base.map((s) => s.id));
    const extra = (detail?.students ?? [])
      .filter((s) => !known.has(s.id))
      .map((s) => ({ id: s.id, full_name: s.full_name, status: s.status }) as StudentListItem);
    const q = studentQuery.trim().toLocaleLowerCase('tr-TR');
    return [...extra, ...base].filter((s) => !q || s.full_name.toLocaleLowerCase('tr-TR').includes(q));
  }, [students, detail, studentQuery]);

  const lessonTypeOptions = useMemo(() => {
    if (lessonType && !LESSON_TYPES.some((t) => t.value === lessonType)) {
      return [...LESSON_TYPES, { value: lessonType, label: lessonType }];
    }
    return LESSON_TYPES;
  }, [lessonType]);

  const toggleStudent = (id: number) =>
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = 'Ders başlığı zorunludur.';
    if (!date) next.date = 'Tarih seçin.';
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (s === null || e === null) next.time = 'Başlangıç ve bitiş saatini girin.';
    else if (e <= s) next.time = 'Bitiş saati başlangıçtan sonra olmalıdır.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (allowConflict = false) => {
    if (!validate()) return;
    setSaving(true);
    setConflicts(null);

    const payload: LessonInput = {
      title: title.trim(),
      lesson_type: lessonType || null,
      lesson_date: date,
      start_time: start,
      end_time: end,
      instructor_user_id: instructorId ? Number(instructorId) : null,
      location_id: locationId ? Number(locationId) : null,
      group_id: groupId ? Number(groupId) : null,
      notes: notes.trim() || null,
      student_ids: studentIds,
    };
    if (allowConflict) payload.allow_conflict = true;

    try {
      if (editing && detail) {
        payload.status = status;
        if (status === 'cancelled') payload.cancellation_reason = cancelReason.trim() || null;
        await api.updateLesson(detail.lesson.id, payload);
        push('Ders güncellendi.', 'success');
      } else {
        if (repeat) payload.repeat_weeks = Math.max(1, Math.min(52, Number(repeatWeeks) || 1));
        const result = await api.createLesson(payload);
        push(result.count > 1 ? `${result.count} ders oluşturuldu.` : 'Ders oluşturuldu.', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && hasConflicts(err.details)) {
        setConflicts(err.details.conflicts);
      } else {
        push(err instanceof ApiError ? err.message : 'Ders kaydedilemedi.', 'error');
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
      title={editing ? 'Dersi Düzenle' : 'Yeni Ders'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button onClick={() => submit(false)} loading={saving}>
            {editing ? 'Değişiklikleri Kaydet' : repeat ? 'Dersleri Oluştur' : 'Dersi Oluştur'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {conflicts && (
          <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p className="font-medium">Seçilen saatte çakışma var:</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
              {conflicts.slice(0, 6).map((c, i) => (
                <li key={`${c.lesson_id}-${i}`}>
                  {c.kind === 'instructor' ? 'Eğitmen' : `Öğrenci (${c.student_name ?? '-'})`}: “{c.title}” ·{' '}
                  {formatDate(c.lesson_date)} {formatTime(c.start_time)}–{formatTime(c.end_time)}
                </li>
              ))}
              {conflicts.length > 6 && <li>… ve {conflicts.length - 6} çakışma daha</li>}
            </ul>
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConflicts(null)}>
                Saati değiştir
              </Button>
              <Button size="sm" onClick={() => submit(true)} loading={saving}>
                Yine de kaydet
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ders başlığı *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder="Örn. Başlangıç Grubu"
              autoFocus
            />
          </div>
          <Input
            label="Tarih *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <Select label="Ders türü" value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
            {lessonTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input label="Başlangıç *" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input
            label="Bitiş *"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            error={errors.time}
          />
        </div>

        {lookupError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{lookupError}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Eğitmen" value={instructorId} onChange={(e) => setInstructorId(e.target.value)} disabled={!lookups}>
            <option value="">Atanmadı</option>
            {lookups?.instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name}
              </option>
            ))}
          </Select>
          <Select label="Lokasyon" value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!lookups}>
            <option value="">Belirtilmedi</option>
            {lookups?.locations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Öğrenciler</span>
            <span className="text-xs text-slate-400">{studentIds.length} seçili</span>
          </div>
          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 p-2">
              <Input
                placeholder="Öğrenci ara..."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
            </div>
            <div className="max-h-44 divide-y divide-slate-50 overflow-y-auto">
              {studentsError && <p className="px-3 py-3 text-xs text-rose-600">{studentsError}</p>}
              {!students && !studentsError && <p className="px-3 py-3 text-xs text-slate-400">Yükleniyor…</p>}
              {students && studentRows.length === 0 && (
                <p className="px-3 py-3 text-xs text-slate-400">Öğrenci bulunamadı.</p>
              )}
              {studentRows.map((s) => {
                const checked = studentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-800',
                      checked && 'bg-brand-50/50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    <span className="truncate">{s.full_name}</span>
                    {s.current_group && <span className="ml-auto text-[11px] text-slate-400">{s.current_group}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <Textarea label="Not" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />

        {!editing && (
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Haftalık tekrarla
            </label>
            {repeat && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <span>İlk dersten sonra</span>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={repeatWeeks}
                  onChange={(e) => setRepeatWeeks(e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <span>hafta daha (toplam {Math.max(1, Math.min(52, Number(repeatWeeks) || 1)) + 1} ders)</span>
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="flex flex-col gap-3 rounded-lg bg-slate-50 px-3 py-3">
            <Select label="Ders durumu" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            {status === 'cancelled' && (
              <Input
                label="İptal nedeni"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Örn. Buz bakımı"
                maxLength={500}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function hasConflicts(details: unknown): details is { conflicts: LessonConflict[] } {
  return (
    typeof details === 'object' &&
    details !== null &&
    Array.isArray((details as { conflicts?: unknown }).conflicts)
  );
}
