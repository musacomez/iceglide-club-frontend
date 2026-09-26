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
import { NewLessonModal } from './NewLessonModal';

type ViewMode = 'day' | 'week' | 'month';

const DAY_START_MIN = 8 * 60; // 08:00
const DAY_END_MIN = 21 * 60; // 21:00
const HOUR_HEIGHT = 56;

export function Calendar({ canMarkAttendance }: { canMarkAttendance: boolean }) {
  const [view, setView] = useState<ViewMode>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Yeni ders ekleme modalı durumları
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string }>({
    date: toISODate(new Date()),
    time: '09:00',
  });

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

  // Grid üzerine tıklandığında saati ve tarihi tespit etme
  const handleSlotClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top; // Tıklanan Y koordinatı
    const hourOffset = clickY / HOUR_HEIGHT;
    const clickedMinutes = DAY_START_MIN + hourOffset * 60;

    // Saati en yakın 30 dakikaya yuvarla
    const roundedMinutes = Math.floor(clickedMinutes / 30) * 30;
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;

    const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    setSelectedSlot({
      date: toISODate(day),
      time: timeString,
    });
    setIsNewModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-800">
      {/* Üst Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={goToday}>
            Bugün
          </Button>
          <button
            onClick={goPrev}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Önceki"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[2]">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Sonraki"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[2]">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <h2 className="ml-1 text-sm font-semibold text-slate-900 sm:text-base">{heading}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Yeni Ders Butonu */}
          <Button
            size="sm"
            onClick={() => {
              setSelectedSlot({ date: toISODate(cursor), time: '09:00' });
              setIsNewModalOpen(true);
            }}
          >
            + Yeni Ders
          </Button>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            title="Yenile"
          >
            <svg className={clsx('h-4 w-4 stroke-[2]', loading && 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all',
                  view === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {v === 'day' ? 'Gün' : v === 'week' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Gün & Hafta Görünümü */}
      {!error && view !== 'month' && (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className={clsx('grid border-b border-slate-100 bg-slate-50/60', view === 'day' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[48px_repeat(7,1fr)]')}>
            <div className="border-r border-slate-100" />
            {days.map((d) => {
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={d.toISOString()}
                  className={clsx(
                    'flex flex-col items-center justify-center border-r border-slate-100 py-2 last:border-r-0',
                    isToday && 'bg-indigo-50/40'
                  )}
                >
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {weekdayShort(d)}
                  </span>
                  <span
                    className={clsx(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <div className={clsx('grid', view === 'day' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[48px_repeat(7,1fr)]')}>
              <div className="relative border-r border-slate-100 select-none bg-slate-50/20" style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}>
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                    className="absolute -translate-y-2 right-1.5 text-[10px] font-medium text-slate-400"
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
                    onClick={(e) => handleSlotClick(d, e)}
                    className="relative border-r border-slate-100 cursor-pointer hover:bg-slate-50/50 transition-colors last:border-r-0"
                    style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                  >
                    {hourMarks.map((m) => (
                      <div
                        key={m}
                        style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                      />
                    ))}

                    {loading && <div className="absolute inset-0 animate-pulse bg-slate-50/30" />}

                    {positioned.map((item) => (
                      <div
                        key={item.lesson.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Ders bloğuna tıklandığında slot click çalışmasın
                          setSelectedLessonId(item.lesson.id);
                        }}
                      >
                        <TimedLessonBlock
                          item={item}
                          dayStartMinutes={DAY_START_MIN}
                          onClick={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ay Görünümü */}
      {!error && view === 'month' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-[1px]">
            {days.map((d) => {
              const dayLessons = (lessonsByDay.get(toISODate(d)) ?? []).slice().sort((a, b) =>
                (a.start_time ?? '').localeCompare(b.start_time ?? '')
              );
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = isSameDay(d, new Date());

              return (
                <div
                  key={d.toISOString()}
                  onClick={() => {
                    setSelectedSlot({ date: toISODate(d), time: '09:00' });
                    setIsNewModalOpen(true);
                  }}
                  className={clsx(
                    'flex min-h-[96px] flex-col gap-1 bg-white p-1.5 transition-colors cursor-pointer hover:bg-slate-50',
                    !inMonth && 'bg-slate-50/40 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                        isToday ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayLessons.slice(0, 3).map((l) => (
                      <div
                        key={l.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLessonId(l.id);
                        }}
                      >
                        <MonthLessonChip lesson={l} onClick={() => {}} />
                      </div>
                    ))}
                    {dayLessons.length > 3 && (
                      <span className="px-1 text-[9px] font-semibold text-slate-400">
                        +{dayLessons.length - 3} daha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ders Detay Modalı */}
      {selectedLessonId !== null && (
        <LessonDetailModal
          lessonId={selectedLessonId}
          canMarkAttendance={canMarkAttendance}
          onClose={() => setSelectedLessonId(null)}
          onAttendanceRecorded={load}
        />
      )}

      {/* Yeni Ders Ekleme Modalı */}
      {isNewModalOpen && (
        <NewLessonModal
          open={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onCreated={load}
          initialDate={selectedSlot.date}
          initialStartTime={selectedSlot.time}
        />
      )}
    </div>
  );
}
