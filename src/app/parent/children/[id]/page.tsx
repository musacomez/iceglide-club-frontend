import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default async function ParentChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard role="parent" title="Çocuk Detayı">
      <StudentDetailView studentId={Number((await params).id)} />
    </RoleGuard>
  );
}
