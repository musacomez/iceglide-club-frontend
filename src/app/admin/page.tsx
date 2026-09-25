import { RoleGuard } from '@/components/layout/RoleGuard';
import { ManagementDashboard } from '@/components/dashboard/ManagementDashboard';

export default function AdminDashboardPage() {
  return (
    <RoleGuard role="admin" title="Yönetici Paneli">
      <ManagementDashboard />
    </RoleGuard>
  );
}
