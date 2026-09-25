import type { LessonListItem } from '@/types/api';
import { timeToMinutes } from '@/lib/utils/date';

export interface PositionedLesson {
  lesson: LessonListItem;
  startMinutes: number;
  endMinutes: number;
  column: number;
  columnCount: number;
}

// Greedy interval-graph column packing so overlapping lessons at the same
// time sit neatly side by side instead of stacking on top of each other.
export function layoutDayLessons(lessons: LessonListItem[]): PositionedLesson[] {
  const withTimes = lessons
    .map((lesson) => {
      const start = timeToMinutes(lesson.start_time) ?? 0;
      const rawEnd = timeToMinutes(lesson.end_time);
      const end = rawEnd !== null && rawEnd > start ? rawEnd : start + 45;
      return { lesson, start, end };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const positioned: PositionedLesson[] = [];
  let cluster: typeof withTimes = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columns: number[] = []; // end time of last lesson in each column
    const assigned: { item: (typeof withTimes)[number]; column: number }[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const columnEnd = columns[c];
        if (columnEnd !== undefined && columnEnd <= item.start) {
          columns[c] = item.end;
          assigned.push({ item, column: c });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push(item.end);
        assigned.push({ item, column: columns.length - 1 });
      }
    }
    const columnCount = columns.length;
    for (const a of assigned) {
      positioned.push({
        lesson: a.item.lesson,
        startMinutes: a.item.start,
        endMinutes: a.item.end,
        column: a.column,
        columnCount,
      });
    }
    cluster = [];
  };

  for (const item of withTimes) {
    if (cluster.length === 0 || item.start < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    } else {
      flushCluster();
      cluster.push(item);
      clusterEnd = item.end;
    }
  }
  flushCluster();

  return positioned;
}
