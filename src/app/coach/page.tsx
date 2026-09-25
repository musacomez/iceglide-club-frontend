import { RoleGuard } from '@/components/layout/RoleGuard';
import { ManagementDashboard } from '@/components/dashboard/ManagementDashboard';

export default function CoachDashboardPage() {
  return (
    <RoleGuard role="head_coach" title="Baş Antrenör Paneli">
      <ManagementDashboard />
    </RoleGuard>
  );
}
