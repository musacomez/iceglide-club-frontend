'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { StudentListItem } from '@/types/api';
import { initials } from '@/lib/utils/format';

export function StudentsTable({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<StudentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listStudents({ status: 'active', search: search || undefined });
      setRows(result);
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

  const columns: Column<StudentListItem>[] = [
    {
      key: 'name',
      header: 'Öğrenci',
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
            {initials(s.full_name)}
          </span>
          <div>
            <p className="font-medium text-slate-900">{s.full_name}</p>
            <p className="text-xs text-slate-400">{s.account_email ?? s.email ?? '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'level', header: 'Seviye', render: (s) => s.current_level ?? '-', hideOnMobile: true },
    { key: 'group', header: 'Grup', render: (s) => s.current_group ?? '-', hideOnMobile: true },
    { key: 'phone', header: 'Telefon', render: (s) => s.phone ?? '-', hideOnMobile: true },
    { key: 'status', header: 'Durum', render: (s) => <Badge tone={s.status === 'active' ? 'green' : 'slate'}>{s.status === 'active' ? 'Aktif' : s.status}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Input placeholder="İsim, telefon veya e-posta ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <div className="rounded-xl2 border border-slate-200 bg-white shadow-card">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={load}
          onRowClick={(s) => router.push(`${basePath}/${s.id}`)}
          emptyTitle="Öğrenci bulunamadı"
          emptyDescription="Arama kriterlerinizi değiştirmeyi deneyin."
        />
      </div>
    </div>
  );
}
