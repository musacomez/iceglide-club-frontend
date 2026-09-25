import { RoleGuard } from '@/components/layout/RoleGuard';
import { UpcomingLessons } from '@/components/dashboard/UpcomingLessons';

export default function StudentDashboardPage() {
  return (
    <RoleGuard role="student" title="Öğrenci Paneli">
      <div className="grid grid-cols-1 gap-5">
        <UpcomingLessons title="Yaklaşan Derslerim" days={7} />
      </div>
    </RoleGuard>
  );
}
