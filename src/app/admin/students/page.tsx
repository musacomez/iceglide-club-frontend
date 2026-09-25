import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentsTable } from '@/components/students/StudentsTable';

export default function AdminStudentsPage() {
  return (
    <RoleGuard role="admin" title="Öğrenciler">
      <StudentsTable basePath="/admin/students" />
    </RoleGuard>
  );
}
