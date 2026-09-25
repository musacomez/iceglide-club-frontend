import { RoleGuard } from '@/components/layout/RoleGuard';
import { UpcomingLessons } from '@/components/dashboard/UpcomingLessons';

export default function InstructorDashboardPage() {
  return (
    <RoleGuard role="instructor" title="Eğitmen Paneli">
      <div className="grid grid-cols-1 gap-5">
        <UpcomingLessons title="Bugünkü ve Yaklaşan Derslerim" days={7} canMarkAttendance />
      </div>
    </RoleGuard>
  );
}
