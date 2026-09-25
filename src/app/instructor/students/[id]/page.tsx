import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default async function InstructorStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard role="instructor" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number((await params).id)} showPayments={false} />
    </RoleGuard>
  );
}
