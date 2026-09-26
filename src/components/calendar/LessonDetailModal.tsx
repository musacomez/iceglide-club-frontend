'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { LessonStatusBadge, AttendanceStatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { LessonDetail } from '@/types/api';
import { formatTime } from '@/lib/utils/date';
import { formatDate } from '@/lib/utils/format';
import clsx from '@/lib/utils/clsx';

const ATTENDANCE_OPTIONS: { value: 'present' | 'late' | 'absent' | 'excused'; label: string }[] = [
  { value: 'present', label: 'Katıldı' },
  { value: 'late', label: 'Geç' },
  { value: 'absent', label: 'Katılmadı' },
  { value: 'excused', label: 'İzinli' },
];

export function LessonDetailModal({
  lessonId,
  canMarkAttendance,
  onClose,
  onAttendanceRecorded,
}: {
  lessonId: number;
  canMarkAttendance: boolean;
  onClose: () => void;
  onAttendanceRecorded?: () => void;
}) {
  const { push } = useToast();
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLesson(lessonId);
      setDetail(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ders bilgisi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const mark = async (studentId: number, status: 'present' | 'late' | 'absent' | 'excused') => {
    setSavingStudentId(studentId);
    try {
      await api.recordAttendance({ lesson_instance_id: lessonId, student_id: studentId, status });
      push('Yoklama kaydedildi.', 'success');
      await load();
      onAttendanceRecorded?.();
    } catch (err) {
      push(err instanceof ApiError ? err.message : 'Yoklama kaydedilemedi.', 'error');
    } finally {
      setSavingStudentId(null);
    }
  };

  const lesson = detail?.lesson;

  return (
    <Modal open onClose={onClose} title="Ders Detayı" size="lg">
      {loading && <SkeletonRows rows={4} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && lesson && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">{lesson.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatDate(lesson.lesson_date)} · {formatTime(lesson.start_time)}–{formatTime(lesson.end_time)}
              </p>
            </div>
            <LessonStatusBadge status={lesson.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
            <InfoField label="Eğitmen" value={lesson.instructor_name ?? 'Atanmadı'} />
            <InfoField label="Tür" value={lesson.lesson_type ?? '-'} />
            <InfoField label="Grup" value={lesson.group_name ?? '-'} />
            <InfoField label="Lokasyon" value={lesson.location_name ?? '-'} />
          </div>

          {lesson.cancellation_reason && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              İptal nedeni: {lesson.cancellation_reason}
            </div>
          )}
          {lesson.notes && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Not: {lesson.notes}</div>}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Öğrenciler ({detail!.students.length})</p>
            {detail!.students.length === 0 ? (
              <p className="text-sm text-slate-500">Bu derse kayıtlı öğrenci yok.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                {detail!.students.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                      <div className="mt-0.5">
                        <AttendanceStatusBadge status={s.attendance_status} />
                      </div>
                    </div>
                    {canMarkAttendance && (
                      <div className="flex flex-wrap gap-1.5">
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            disabled={savingStudentId === s.id}
                            onClick={() => mark(s.id, opt.value)}
                            className={clsx(
                              'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50',
                              s.attendance_status === opt.value
                                ? 'border-brand-500 bg-brand-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </Modal>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
