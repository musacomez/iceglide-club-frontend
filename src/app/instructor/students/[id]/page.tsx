import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentDetailView } from '@/components/students/StudentDetailView';

export default function InstructorStudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard role="instructor" title="Öğrenci Detayı">
      <StudentDetailView studentId={Number(params.id)} showPayments={false} />
    </RoleGuard>
  );
}
