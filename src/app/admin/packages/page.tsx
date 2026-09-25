'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentPicker } from '@/components/students/StudentPicker';
import { PackagesList } from '@/components/packages/PackagesList';
import { EmptyState } from '@/components/ui/EmptyState';
import type { StudentListItem } from '@/types/api';

export default function AdminPackagesPage() {
  const [student, setStudent] = useState<StudentListItem | null>(null);

  return (
    <RoleGuard role="admin" title="Paketler">
      <p className="mb-4 text-sm text-slate-500">
        API yalnızca öğrenci başına paket sorgusu sunduğundan, paketleri görmek için önce bir öğrenci seçin.
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <StudentPicker selectedId={student?.id ?? null} onSelect={setStudent} />
        {student ? (
          <PackagesList studentId={student.id} title={`${student.full_name} - Paketler`} />
        ) : (
          <EmptyState title="Bir öğrenci seçin" description="Paketlerini görmek için soldaki listeden bir öğrenci seçin." />
        )}
      </div>
    </RoleGuard>
  );
}
