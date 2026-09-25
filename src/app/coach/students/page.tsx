import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentsTable } from '@/components/students/StudentsTable';

export default function CoachStudentsPage() {
  return (
    <RoleGuard role="head_coach" title="Öğrenciler">
      <StudentsTable basePath="/coach/students" />
    </RoleGuard>
  );
}
