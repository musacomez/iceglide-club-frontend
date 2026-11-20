'use client';

import clsx from '@/lib/utils/clsx';
import type { LessonListItem } from '@/types/api';
import { formatTime } from '@/lib/utils/date';
import type { PositionedLesson } from './lessonLayout';

const LESSON_COLORS = [
  'bg-sky-100 border-sky-200 border-s-sky-600 text-sky-950 hover:bg-sky-200',
  'bg-violet-100 border-violet-200 border-s-violet-600 text-violet-950 hover:bg-violet-200',
  'bg-emerald-100 border-emerald-200 border-s-emerald-600 text-emerald-950 hover:bg-emerald-200',
  'bg-amber-100 border-amber-200 border-s-amber-600 text-amber-950 hover:bg-amber-200',
  'bg-rose-100 border-rose-200 border-s-rose-600 text-rose-950 hover:bg-rose-200',
  'bg-cyan-100 border-cyan-200 border-s-cyan-600 text-cyan-950 hover:bg-cyan-200',
  'bg-orange-100 border-orange-200 border-s-orange-600 text-orange-950 hover:bg-orange-200',
  'bg-fuchsia-100 border-fuchsia-200 border-s-fuchsia-600 text-fuchsia-950 hover:bg-fuchsia-200',
];

function lessonStyle(lesson: LessonListItem) {
  return lesson.status === 'cancelled'
    ? 'bg-slate-100 border-slate-200 border-s-slate-500 text-slate-700 line-through'
    : LESSON_COLORS[lesson.id % LESSON_COLORS.length];
}

function lessonLabel(lesson: LessonListItem) {
  const status = lesson.status === 'cancelled' ? ' · İptal edildi'
    : lesson.status === 'completed' ? ' · Tamamlandı' : '';
  return `${formatTime(lesson.start_time)} ${lesson.title}${status}`;
}

function LessonTitle({ lesson }: { lesson: LessonListItem }) {
  return (
    <>
      {lesson.status === 'completed' && <span aria-hidden="true">✓ </span>}
      {formatTime(lesson.start_time)} {lesson.title}
    </>
  );
}

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
  const height = Math.min((1440 - item.startMinutes) * PX_PER_MINUTE,
    Math.max((item.endMinutes - item.startMinutes) * PX_PER_MINUTE, 26));
  const widthPct = 100 / item.columnCount;
  const leftPct = item.column * widthPct;

  return (
    <button
      type="button"
      aria-label={lessonLabel(item.lesson)}
      title={lessonLabel(item.lesson)}
      onClick={() => onClick(item.lesson)}
      style={{
        top,
        height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      className={clsx(
        'absolute overflow-hidden rounded-md border border-s-4 px-2 py-1 text-left text-xs leading-tight shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
        lessonStyle(item.lesson),
      )}
    >
      <p className="truncate font-semibold"><LessonTitle lesson={item.lesson} /></p>
      {height > 34 && (
        <p className="truncate text-[10px] opacity-80">
          {item.lesson.instructor_names?.join(', ') || item.lesson.instructor_name || 'Antrenör atanmadı'}
          {item.lesson.location_name ? ` · ${item.lesson.location_name}` : ''}
        </p>
      )}
    </button>
  );
}

export function MonthLessonChip({ lesson, onClick }: { lesson: LessonListItem; onClick: (l: LessonListItem) => void }) {
  return (
    <button
      type="button"
      aria-label={lessonLabel(lesson)}
      title={lessonLabel(lesson)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(lesson);
      }}
      className={clsx(
        'block w-full truncate rounded border border-s-2 px-1 py-0.5 text-left text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
        lessonStyle(lesson),
      )}
    >
      <LessonTitle lesson={lesson} />
    </button>
  );
}
