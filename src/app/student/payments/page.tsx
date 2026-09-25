'use client';

import { RoleGuard } from '@/components/layout/RoleGuard';
import { PaymentsList } from '@/components/payments/PaymentsList';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOwnStudent } from '@/lib/useOwnStudent';

export default function StudentPaymentsPage() {
  const { student, loading, error } = useOwnStudent();

  return (
    <RoleGuard role="student" title="Ödemelerim">
      {loading && <SkeletonRows rows={3} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !student && <EmptyState title="Öğrenci kaydı bulunamadı" />}
      {!loading && !error && student && <PaymentsList studentId={student.id} />}
    </RoleGuard>
  );
}
