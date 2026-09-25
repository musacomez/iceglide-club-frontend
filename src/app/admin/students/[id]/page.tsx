import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard role="admin" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number((await params).id)} />
    </RoleGuard>
  );
}
