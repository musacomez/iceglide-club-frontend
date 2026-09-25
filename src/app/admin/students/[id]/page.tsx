import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default function AdminStudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard role="admin" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number(params.id)} />
    </RoleGuard>
  );
}
