import { RoleGuard } from '@/components/layout/RoleGuard';
import { Calendar } from '@/components/calendar/Calendar';

export default function StudentCalendarPage() {
  return (
    <RoleGuard role="student" title="Takvim">
      <Calendar canMarkAttendance={false} />
    </RoleGuard>
  );
}
