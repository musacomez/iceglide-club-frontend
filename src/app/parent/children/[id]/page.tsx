import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default function ParentChildDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard role="parent" title="Çocuk Detayı">
      <StudentDetailView studentId={Number(params.id)} />
    </RoleGuard>
  );
}
