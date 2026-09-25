import { RoleGuard } from '@/components/layout/RoleGuard';
import { Calendar } from '@/components/calendar/Calendar';

export default function CoachCalendarPage() {
  return (
    <RoleGuard role="head_coach" title="Takvim">
      <Calendar canMarkAttendance />
    </RoleGuard>
  );
}
