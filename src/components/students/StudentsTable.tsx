'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StudentFormModal } from './StudentFormModal';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { StudentListItem } from '@/types/api';
import { initials } from '@/lib/utils/format';

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  frozen: 'Dondurulmuş',
};

export function StudentsTable({ basePath, canManage = false }: { basePath: string; canManage?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [creating, setCreating] = useState(false);
  const [rows, setRows] = useState<StudentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listStudents({ status, search: search || undefined });
      setRows(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Öğrenciler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

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
    { key: 'status', header: 'Durum', render: (s) => <Badge tone={s.status === 'active' ? 'green' : 'slate'}>{STATUS_LABEL[s.status] ?? s.status}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Input
            placeholder="İsim, telefon veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />
          {canManage && (
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Durum filtresi">
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="frozen">Dondurulmuş</option>
            </Select>
          )}
        </div>
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Yeni Öğrenci
          </Button>
        )}
      </div>
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

      {canManage && creating && (
        <StudentFormModal
          onClose={() => setCreating(false)}
          onSaved={(id) => router.push(`${basePath}/${id}`)}
        />
      )}
    </div>
  );
}
