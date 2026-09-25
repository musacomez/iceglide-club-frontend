import clsx from '@/lib/utils/clsx';

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet';

const TONE_CLASSES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-rose-100 text-rose-700',
  blue: 'bg-brand-100 text-brand-800',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

const LESSON_STATUS_TONE: Record<string, Tone> = {
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export function LessonStatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    scheduled: 'Planlandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal edildi',
  };
  return <Badge tone={LESSON_STATUS_TONE[status] ?? 'slate'}>{label[status] ?? status}</Badge>;
}

const ATTENDANCE_TONE: Record<string, Tone> = {
  present: 'green',
  late: 'amber',
  absent: 'red',
  excused: 'violet',
};

export function AttendanceStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge tone="slate">Kaydedilmedi</Badge>;
  const label: Record<string, string> = {
    present: 'Katıldı',
    late: 'Geç geldi',
    absent: 'Katılmadı',
    excused: 'İzinli',
  };
  return <Badge tone={ATTENDANCE_TONE[status] ?? 'slate'}>{label[status] ?? status}</Badge>;
}

const PACKAGE_TONE: Record<string, Tone> = {
  active: 'green',
  expired: 'red',
  completed: 'slate',
};

export function PackageStatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    active: 'Aktif',
    expired: 'Süresi doldu',
    completed: 'Tamamlandı',
  };
  return <Badge tone={PACKAGE_TONE[status] ?? 'slate'}>{label[status] ?? status}</Badge>;
}
