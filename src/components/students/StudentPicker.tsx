'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { StudentListItem } from '@/types/api';
import { initials } from '@/lib/utils/format';
import clsx from '@/lib/utils/clsx';

// The Worker only exposes packages/payments per student (no "list all"
// endpoint). This picker lets admin/head_coach/parent choose which student's
// packages or payments to view, instead of inventing a list-all endpoint.
export function StudentPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (student: StudentListItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<StudentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.listStudents({ status: 'active', search: search || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Öğrenciler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Öğrenci ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {loading && <SkeletonRows rows={3} />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && (!rows || rows.length === 0) && <EmptyState title="Öğrenci bulunamadı" />}
        {!loading &&
          !error &&
          rows?.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={clsx(
                'flex w-full items-center gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50',
                selectedId === s.id && 'bg-brand-50',
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
                {initials(s.full_name)}
              </span>
              <span className="text-sm font-medium text-slate-800">{s.full_name}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
