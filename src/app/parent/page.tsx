import { RoleGuard } from '@/components/layout/RoleGuard';
import { UpcomingLessons } from '@/components/dashboard/UpcomingLessons';

export default function ParentDashboardPage() {
  return (
    <RoleGuard role="parent" title="Veli Paneli">
      <div className="grid grid-cols-1 gap-5">
        <UpcomingLessons title="Çocuklarımın Yaklaşan Dersleri" days={7} />
      </div>
    </RoleGuard>
  );
}
