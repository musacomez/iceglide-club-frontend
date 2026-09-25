import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentsTable } from '@/components/students/StudentsTable';

export default function InstructorStudentsPage() {
  return (
    <RoleGuard role="instructor" title="Öğrencilerim">
      <StudentsTable basePath="/instructor/students" />
    </RoleGuard>
  );
}
