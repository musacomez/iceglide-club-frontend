'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { StudentPicker } from '@/components/students/StudentPicker';
import { PaymentsList } from '@/components/payments/PaymentsList';
import { EmptyState } from '@/components/ui/EmptyState';
import type { StudentListItem } from '@/types/api';

export default function AdminPaymentsPage() {
  const [student, setStudent] = useState<StudentListItem | null>(null);

  return (
    <RoleGuard role="admin" title="Ödemeler">
      <p className="mb-4 text-sm text-slate-500">
        API yalnızca öğrenci başına ödeme sorgusu sunduğundan, ödemeleri görmek için önce bir öğrenci seçin.
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <StudentPicker selectedId={student?.id ?? null} onSelect={setStudent} />
        {student ? (
          <PaymentsList studentId={student.id} title={`${student.full_name} - Ödemeler`} />
        ) : (
          <EmptyState title="Bir öğrenci seçin" description="Ödemelerini görmek için soldaki listeden bir öğrenci seçin." />
        )}
      </div>
    </RoleGuard>
  );
}
