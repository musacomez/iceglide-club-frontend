'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import clsx from '@/lib/utils/clsx';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { LessonListItem } from '@/types/api';
import {
  addDays,
  addMonths,
  dayLabel,
  endOfMonth,
  isSameDay,
  monthLabel,
  startOfMonth,
  startOfWeek,
  toISODate,
  weekdayShort,
} from '@/lib/utils/date';
import { layoutDayLessons } from './lessonLayout';
import { TimedLessonBlock, MonthLessonChip } from './LessonPill';
import { LessonDetailModal } from './LessonDetailModal';

type ViewMode = 'day' | 'week' | 'month';

const DAY_START_MIN = 7 * 60; // 07:00
const DAY_END_MIN = 21 * 60; // 21:00
const HOUR_HEIGHT = 60;

export function Calendar({ canMarkAttendance }: { canMarkAttendance: boolean }) {
  const [view, setView] = useState<ViewMode>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const range = useMemo(() => {
    if (view === 'day') return { from: cursor, to: cursor };
    if (view === 'week') {
      const start = startOfWeek(cursor);
      return { from: start, to: addDays(start, 6) };
    }
    const start = startOfMonth(cursor);
    const gridStart = startOfWeek(start);
    const gridEnd = addDays(startOfWeek(endOfMonth(cursor)), 6);
    return { from: gridStart, to: gridEnd };
  }, [view, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listLessons(toISODate(range.from), toISODate(range.to));
      setLessons(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dersler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const goToday = () => setCursor(new Date());
  const goPrev = () =>
    setCursor((c) => (view === 'day' ? addDays(c, -1) : view === 'week' ? addDays(c, -7) : addMonths(c, -1)));
  const goNext = () =>
    setCursor((c) => (view === 'day' ? addDays(c, 1) : view === 'week' ? addDays(c, 7) : addMonths(c, 1)));

  const heading = view === 'month' ? monthLabel(cursor) : dayLabel(view === 'day' ? cursor : startOfWeek(cursor));

  const days = useMemo(() => {
    if (view === 'day') return [cursor];
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));
    const start = startOfWeek(startOfMonth(cursor));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [view, cursor]);

  const lessonsByDay = useMemo(() => {
    const map = new Map<string, LessonListItem[]>();
    for (const l of lessons ?? []) {
      const key = l.lesson_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [lessons]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) marks.push(m);
    return marks;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} aria-label="Önceki">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} aria-label="Sonraki">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Bugün
          </Button>
          <h2 className="ml-1 text-sm font-semibold text-slate-900 sm:text-base">{heading}</h2>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                view === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {v === 'day' ? 'Gün' : v === 'week' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && view !== 'month' && (
        <div className="overflow-x-auto rounded-xl2 border border-slate-200 bg-white shadow-card">
          <div className={clsx('grid', view === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[56px_repeat(7,minmax(120px,1fr))]')}>
            <div className="border-r border-slate-100" />
            {days.map((d) => (
              <div
                key={d.toISOString()}
                className={clsx(
                  'border-b border-r border-slate-100 px-2 py-2 text-center last:border-r-0',
                  isSameDay(d, new Date()) && 'bg-brand-50/60',
                )}
              >
                <p className="text-[11px] font-medium uppercase text-slate-400">{weekdayShort(d)}</p>
                <p className={clsx('text-sm font-semibold', isSameDay(d, new Date()) ? 'text-brand-700' : 'text-slate-800')}>
                  {d.getDate()}
                </p>
              </div>
            ))}

            <div className="relative border-r border-slate-100" style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}>
              {hourMarks.map((m) => (
                <div
                  key={m}
                  style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                  className="absolute -translate-y-2 right-1 text-[10px] text-slate-400"
                >
                  {String(Math.floor(m / 60)).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((d) => {
              const dayLessons = lessonsByDay.get(toISODate(d)) ?? [];
              const positioned = layoutDayLessons(dayLessons);
              return (
                <div
                  key={d.toISOString()}
                  className="relative border-r border-slate-100 last:border-r-0"
                  style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                >
                  {hourMarks.map((m) => (
                    <div
                      key={m}
                      style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                      className="absolute left-0 right-0 border-t border-slate-50"
                    />
                  ))}
                  {loading && <div className="absolute inset-0 animate-pulse bg-slate-50/60" />}
                  {positioned.map((item) => (
                    <TimedLessonBlock
                      key={item.lesson.id}
                      item={{
                        ...item,
                        startMinutes: (item.startMinutes - DAY_START_MIN) + DAY_START_MIN,
                      }}
                      dayStartMinutes={DAY_START_MIN}
                      onClick={(lesson) => setSelectedLessonId(lesson.id)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!error && view === 'month' && (
        <div className="overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-card">
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-medium uppercase text-slate-400">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const dayLessons = (lessonsByDay.get(toISODate(d)) ?? []).slice().sort((a, b) =>
                (a.start_time ?? '').localeCompare(b.start_time ?? ''),
              );
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    setCursor(d);
                    setView('day');
                  }}
                  className={clsx(
                    'flex min-h-[96px] flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left align-top last:[&:nth-child(7n)]:border-r-0',
                    !inMonth && 'bg-slate-50/60',
                    isSameDay(d, new Date()) && 'bg-brand-50/50',
                  )}
                >
                  <span className={clsx('text-xs font-medium', inMonth ? 'text-slate-700' : 'text-slate-300')}>
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayLessons.slice(0, 3).map((l) => (
                      <MonthLessonChip key={l.id} lesson={l} onClick={(lesson) => setSelectedLessonId(lesson.id)} />
                    ))}
                    {dayLessons.length > 3 && (
                      <span className="px-1 text-[10px] text-slate-400">+{dayLessons.length - 3} daha</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedLessonId !== null && (
        <LessonDetailModal
          lessonId={selectedLessonId}
          canMarkAttendance={canMarkAttendance}
          onClose={() => setSelectedLessonId(null)}
          onAttendanceRecorded={load}
        />
      )}
    </div>
  );
}
