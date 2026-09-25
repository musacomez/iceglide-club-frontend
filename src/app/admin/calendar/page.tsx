import { RoleGuard } from '@/components/layout/RoleGuard';
import { Calendar } from '@/components/calendar/Calendar';

export default function AdminCalendarPage() {
  return (
    <RoleGuard role="admin" title="Takvim">
      <Calendar canMarkAttendance />
    </RoleGuard>
  );
}
