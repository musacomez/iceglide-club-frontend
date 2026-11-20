'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentPicker } from '@/components/students/StudentPicker';
import { StudentFinance } from '@/components/payments/StudentFinance';
import { EmptyState } from '@/components/ui/EmptyState';
import type { StudentListItem } from '@/types/api';

export default function AdminPaymentsPage() {
  const [student, setStudent] = useState<StudentListItem | null>(null);

  return (
    <RoleGuard role="admin" title="Finans">
      <p className="mb-4 text-sm text-slate-500">
        Borçları ve tahsilatları yönetmek için bir öğrenci seçin.
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <StudentPicker includeInactive selectedId={student?.id ?? null} onSelect={setStudent} />
        {student ? (
          <StudentFinance key={student.id} studentId={student.id} studentName={student.full_name} />
        ) : (
          <EmptyState title="Bir öğrenci seçin" description="Borç ve tahsilat geçmişi seçtiğin öğrenci için açılır." />
        )}
      </div>
    </RoleGuard>
  );
}
