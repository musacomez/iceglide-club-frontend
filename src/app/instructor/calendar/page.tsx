import { RoleGuard } from '@/components/layout/RoleGuard';
import { Calendar } from '@/components/calendar/Calendar';

export default function InstructorCalendarPage() {
  return (
    <RoleGuard role="instructor" title="Takvim">
      <Calendar canMarkAttendance />
    </RoleGuard>
  );
}
