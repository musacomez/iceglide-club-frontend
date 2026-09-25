import { RoleGuard } from '@/components/layout/RoleGuard';
import { Calendar } from '@/components/calendar/Calendar';

export default function ParentCalendarPage() {
  return (
    <RoleGuard role="parent" title="Takvim">
      <Calendar canMarkAttendance={false} />
    </RoleGuard>
  );
}
