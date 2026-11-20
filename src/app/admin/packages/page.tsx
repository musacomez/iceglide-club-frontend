'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentPicker } from '@/components/students/StudentPicker';
import { PackageTypesPanel } from '@/components/packages/PackageTypesPanel';
import { PackagesList } from '@/components/packages/PackagesList';
import { EmptyState } from '@/components/ui/EmptyState';
import type { StudentListItem } from '@/types/api';

export default function AdminPackagesPage() {
  const [student, setStudent] = useState<StudentListItem | null>(null);

  return (
    <RoleGuard role="admin" title="Paketler">
      <div className="mb-5"><PackageTypesPanel /></div>
      <p className="mb-4 text-sm text-slate-500">
        Paketlerini görüntülemek veya paket atamak için bir öğrenci seçin.
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <StudentPicker selectedId={student?.id ?? null} onSelect={setStudent} />
        {student ? (
          <PackagesList key={student.id} studentId={student.id} title={`${student.full_name} - Paketler`} canAssign={student.status === 'active'} />
        ) : (
          <EmptyState title="Bir öğrenci seçin" description="Paketlerini görmek için soldaki listeden bir öğrenci seçin." />
        )}
      </div>
    </RoleGuard>
  );
}
