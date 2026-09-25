'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { StudentListItem } from '@/types/api';

// For the `student` role, GET /api/students already scopes to
// `s.user_id = ?` (see src/routes/students.ts) - so it always returns
// exactly the signed-in student's own record. This hook fetches that once.
export function useOwnStudent() {
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await api.listStudents({ status: 'active' });
        if (!cancelled) setStudent(rows[0] ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Öğrenci bilgisi yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { student, loading, error };
}
