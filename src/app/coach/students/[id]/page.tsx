import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default async function CoachStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard role="head_coach" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number((await params).id)} />
    </RoleGuard>
  );
}
