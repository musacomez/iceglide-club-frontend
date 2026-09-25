'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { LessonStatusBadge } from '@/components/ui/Badge';
import { LessonDetailModal } from '@/components/calendar/LessonDetailModal';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { LessonListItem } from '@/types/api';
import { addDays, toISODate, formatTime } from '@/lib/utils/date';
import { formatDate } from '@/lib/utils/format';

// A compact "next N days of lessons" list, reused across the instructor,
// parent and student dashboards - all three hit the exact same
// GET /api/lessons?from&to endpoint, which the Worker already scopes to
// what that role is allowed to see.
export function UpcomingLessons({
  title = 'Yaklaşan Dersler',
  days = 7,
  canMarkAttendance = false,
}: {
  title?: string;
  days?: number;
  canMarkAttendance?: boolean;
}) {
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const result = await api.listLessons(toISODate(today), toISODate(addDays(today, days)));
      setLessons(result.filter((l) => l.status !== 'cancelled').slice(0, 8));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dersler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader title={title} />
      {loading && <SkeletonRows rows={4} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (!lessons || lessons.length === 0) && (
        <EmptyState title="Yaklaşan ders yok" />
      )}
      {!loading && !error && lessons && lessons.length > 0 && (
        <div className="divide-y divide-slate-100">
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{l.title}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(l.lesson_date)} · {formatTime(l.start_time)}–{formatTime(l.end_time)}
                  {l.instructor_name ? ` · ${l.instructor_name}` : ''}
                </p>
              </div>
              <LessonStatusBadge status={l.status} />
            </button>
          ))}
        </div>
      )}
      {selectedId !== null && (
        <LessonDetailModal
          lessonId={selectedId}
          canMarkAttendance={canMarkAttendance}
          onClose={() => setSelectedId(null)}
          onAttendanceRecorded={load}
        />
      )}
    </Card>
  );
}
