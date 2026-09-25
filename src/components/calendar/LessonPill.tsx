'use client';

import clsx from '@/lib/utils/clsx';
import type { LessonListItem } from '@/types/api';
import { formatTime } from '@/lib/utils/date';
import type { PositionedLesson } from './lessonLayout';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-brand-50 border-brand-300 text-brand-900',
  completed: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  cancelled: 'bg-slate-100 border-slate-300 text-slate-500 line-through decoration-slate-300',
};

const PX_PER_MINUTE = 1;

export function TimedLessonBlock({
  item,
  dayStartMinutes,
  onClick,
}: {
  item: PositionedLesson;
  dayStartMinutes: number;
  onClick: (lesson: LessonListItem) => void;
}) {
  const top = (item.startMinutes - dayStartMinutes) * PX_PER_MINUTE;
  const height = Math.max((item.endMinutes - item.startMinutes) * PX_PER_MINUTE, 26);
  const widthPct = 100 / item.columnCount;
  const leftPct = item.column * widthPct;

  return (
    <button
      onClick={() => onClick(item.lesson)}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      className={clsx(
        'absolute overflow-hidden rounded-md border px-2 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md',
        STATUS_STYLES[item.lesson.status] ?? 'bg-slate-50 border-slate-300 text-slate-700',
      )}
    >
      <p className="truncate font-semibold">{formatTime(item.lesson.start_time)} {item.lesson.title}</p>
      {height > 34 && (
        <p className="truncate text-[10px] opacity-80">
          {item.lesson.instructor_name ?? 'Eğitmen atanmadı'}
          {item.lesson.location_name ? ` · ${item.lesson.location_name}` : ''}
        </p>
      )}
    </button>
  );
}

export function MonthLessonChip({ lesson, onClick }: { lesson: LessonListItem; onClick: (l: LessonListItem) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(lesson);
      }}
      className={clsx(
        'block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium',
        STATUS_STYLES[lesson.status] ?? 'bg-slate-50 text-slate-700',
      )}
    >
      {formatTime(lesson.start_time)} {lesson.title}
    </button>
  );
}
