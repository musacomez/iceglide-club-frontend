import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default function CoachStudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard role="head_coach" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number(params.id)} />
    </RoleGuard>
  );
}
