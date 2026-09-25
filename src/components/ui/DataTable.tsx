'use client';

import clsx from '@/lib/utils/clsx';
import { EmptyState } from './EmptyState';
import { SkeletonRows } from './Skeleton';
import { ErrorState } from './ErrorState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  loading,
  error,
  onRetry,
  emptyTitle = 'Kayıt bulunamadı',
  emptyDescription,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) return <SkeletonRows rows={5} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={clsx('px-5 py-3 font-medium', col.hideOnMobile && 'hidden sm:table-cell')}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'border-b border-slate-50 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-slate-50',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx('px-5 py-3 text-slate-700', col.className, col.hideOnMobile && 'hidden sm:table-cell')}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
