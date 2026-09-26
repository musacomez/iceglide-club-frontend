'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
// Varsa projenizdeki NewLessonModal veya benzeri bir dialog bileşenini içe aktarın:
import { NewLessonModal } from './NewLessonModal'; 

type ViewMode = 'day' | 'week' | 'month';

const DAY_START_MIN = 7 * 60; // 07:00
const DAY_END_MIN = 22 * 60; // 22:00 (Google Takvim genişliği için 22:00 yapıldı)
const HOUR_HEIGHT = 64; // Saat başına piksel yüksekliği

// Google Takvim Renk Paleti (Ders durumuna veya tipine göre)
export const LESSON_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  COMPLETED: { bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-rose-50 hover:bg-rose-100', border: 'border-rose-400', text: 'text-rose-900', dot: 'bg-rose-500' },
  PLANNED: { bg: 'bg-indigo-50 hover:bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-900', dot: 'bg-indigo-500' },
  DEFAULT: { bg: 'bg-sky-50 hover:bg-sky-100', border: 'border-sky-500', text: 'text-sky-900', dot: 'bg-sky-500' },
};

export function Calendar({ canMarkAttendance }: { canMarkAttendance: boolean }) {
  const [view, setView] = useState<ViewMode>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal Yönetimleri
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [isNewLessonOpen, setIsNewLessonOpen] = useState(false);
  const [newLessonInitialData, setNewLessonInitialData] = useState<{ date: string; time?: string } | null>(null);

  // Güncel Saat Çizgisi Takibi
  const [now, setNow] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Sayfa yüklendiğinde mevcut saate otomatik scroll
  useEffect(() => {
    if (view !== 'month' && scrollContainerRef.current) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (currentMinutes >= DAY_START_MIN && currentMinutes <= DAY_END_MIN) {
        const top = ((currentMinutes - DAY_START_MIN) / 60) * HOUR_HEIGHT - 100;
        scrollContainerRef.current.scrollTop = Math.max(0, top);
      }
    }
  }, [view]);

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

  // Boş bir zaman dilimine tıklandığında Hızlı Ders Ekleme aç
  const handleSlotClick = (date: Date, hourMinutes: number) => {
    const hours = Math.floor(hourMinutes / 60).toString().padStart(2, '0');
    const mins = (hourMinutes % 60).toString().padStart(2, '0');
    setNewLessonInitialData({
      date: toISODate(date),
      time: `${hours}:${mins}`,
    });
    setIsNewLessonOpen(true);
  };

  // Kırmızı Anlık Zaman Çizgisinin Konumu (Dakika bazlı)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const showCurrentTimeLine = currentMinutes >= DAY_START_MIN && currentMinutes <= DAY_END_MIN;
  const currentTimeTop = ((currentMinutes - DAY_START_MIN) / 60) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-800">
      {/* Üst Bar / Google Takvim Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        {/* Sol Taraf: Ekle Butonu, Gezinti, Başlık */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => {
              setNewLessonInitialData({ date: toISODate(new Date()) });
              setIsNewLessonOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95 sm:text-sm"
          >
            <svg className="h-4 w-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Yeni Ders</span>
          </Button>

          <div className="h-6 w-px bg-slate-200" />

          <Button variant="outline" size="sm" onClick={goToday} className="rounded-lg text-xs font-semibold">
            Bugün
          </Button>

          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/50 p-0.5">
            <button
              onClick={goPrev}
              className="rounded-md p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-all"
              aria-label="Önceki"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[2.2]">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="rounded-md p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-all"
              aria-label="Sonraki"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[2.2]">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <h2 className="ml-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg">{heading}</h2>
        </div>

        {/* Sağ Taraf: Görünüm Modları ve Yenileme */}
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            title="Yenile"
          >
            <svg className={clsx('h-4 w-4 stroke-[2]', loading && 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex rounded-xl border border-slate-200 bg-slate-100/70 p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all',
                  view === v ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {v === 'day' ? 'Gün' : v === 'week' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* GÜN & HAFTA GÖRÜNÜMÜ */}
      {!error && view !== 'month' && (
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-card">
          {/* Gün Header Satırı */}
          <div className={clsx('grid border-b border-slate-200 bg-slate-50/50 sticky top-0 z-10', view === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[48px_repeat(7,minmax(120px,1fr))] sm:grid-cols-[56px_repeat(7,1fr)]')}>
            <div className="border-r border-slate-100" />
            {days.map((d) => {
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={d.toISOString()}
                  className={clsx(
                    'flex flex-col items-center justify-center border-r border-slate-100 py-2.5 last:border-r-0',
                    isToday && 'bg-indigo-50/30'
                  )}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {weekdayShort(d)}
                  </span>
                  <span
                    className={clsx(
                      'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                      isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-800'
                    )}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Saat Izgarası - Kaydırılabilir Alan */}
          <div ref={scrollContainerRef} className="max-h-[680px] overflow-y-auto overflow-x-auto relative">
            <div className={clsx('grid min-w-[700px] sm:min-w-0', view === 'day' ? 'grid-cols-[56px_1fr]' : 'grid-cols-[48px_repeat(7,minmax(120px,1fr))] sm:grid-cols-[56px_repeat(7,1fr)]')}>
              {/* Sol Saat Etiketleri */}
              <div className="relative border-r border-slate-100 select-none bg-slate-50/20" style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}>
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                    className="absolute -translate-y-2.5 right-2 text-[10px] font-medium text-slate-400"
                  >
                    {String(Math.floor(m / 60)).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Gün Sütunları */}
              {days.map((d) => {
                const dayLessons = lessonsByDay.get(toISODate(d)) ?? [];
                const positioned = layoutDayLessons(dayLessons);
                const isToday = isSameDay(d, new Date());

                return (
                  <div
                    key={d.toISOString()}
                    className="relative border-r border-slate-100 last:border-r-0"
                    style={{ height: ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                  >
                    {/* Saat Izgara Çizgileri & Tıklanabilir Slotlar */}
                    {hourMarks.map((m) => (
                      <div
                        key={m}
                        onClick={() => handleSlotClick(d, m)}
                        style={{ top: ((m - DAY_START_MIN) / 60) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        className="absolute left-0 right-0 border-t border-slate-100/70 hover:bg-indigo-50/20 transition-colors cursor-pointer group"
                      >
                        <div className="hidden group-hover:block absolute left-2 top-1 text-[9px] font-medium text-indigo-400">
                          + Ders Ekle
                        </div>
                      </div>
                    ))}

                    {/* Kırmızı Canlı Zaman Çizgisi (Bugün için) */}
                    {isToday && showCurrentTimeLine && (
                      <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: currentTimeTop }}
                      >
                        <div className="-ml-1.5 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white shadow-xs" />
                        <div className="h-[2px] w-full bg-rose-500" />
                      </div>
                    )}

                    {loading && <div className="absolute inset-0 animate-pulse bg-slate-50/40" />}

                    {/* Ders Blokları */}
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
        </div>
      )}

      {/* AY GÖRÜNÜMÜ */}
      {!error && view === 'month' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/60 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <div key={d} className="py-2.5">{d}</div>
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
                    setCursor(d);
                    setView('day');
                  }}
                  className={clsx(
                    'flex min-h-[105px] flex-col gap-1 bg-white p-1.5 transition-colors cursor-pointer hover:bg-slate-50/80',
                    !inMonth && 'bg-slate-50/40 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        isToday ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayLessons.slice(0, 3).map((l) => (
                      <MonthLessonChip
                        key={l.id}
                        lesson={l}
                        onClick={(lesson) => setSelectedLessonId(lesson.id)}
                      />
                    ))}
                    {dayLessons.length > 3 && (
                      <span className="px-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600">
                        +{dayLessons.length - 3} ders daha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DERS DETAY MODALI */}
      {selectedLessonId !== null && (
        <LessonDetailModal
          lessonId={selectedLessonId}
          canMarkAttendance={canMarkAttendance}
          onClose={() => setSelectedLessonId(null)}
          onAttendanceRecorded={load}
        />
      )}

      {/* YENİ DERS EKLEME MODALI */}
      {isNewLessonOpen && (
        <NewLessonModal
          initialDate={newLessonInitialData?.date}
          initialTime={newLessonInitialData?.time}
          onClose={() => setIsNewLessonOpen(false)}
          onSuccess={() => {
            setIsNewLessonOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
