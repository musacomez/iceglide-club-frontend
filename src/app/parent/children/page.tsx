import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentsTable } from '@/components/students/StudentsTable';

export default function ParentChildrenPage() {
  return (
    <RoleGuard role="parent" title="Çocuklarım">
      <StudentsTable basePath="/parent/children" />
    </RoleGuard>
  );
}
