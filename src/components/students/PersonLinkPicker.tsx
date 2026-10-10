'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import clsx from '@/lib/utils/clsx';

export interface PersonOption {
  id: number;
  full_name: string;
  email?: string;
}

// Çoklu kişi seçici (veli / eğitmen). `selected` sırası önemlidir: backend
// ilk elemanı "birincil" kabul eder. Seçili kişilerden biri "Birincil" olarak
// işaretlenir ve listenin başına alınır.
export function PersonLinkPicker({
  label,
  options,
  selected,
  onChange,
  emptyText,
}: {
  label: string;
  options: PersonOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  emptyText: string;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    if (!q) return options;
    return options.filter(
      (o) =>
        o.full_name.toLocaleLowerCase('tr-TR').includes(q) ||
        (o.email ?? '').toLocaleLowerCase('tr-TR').includes(q),
    );
  }, [options, query]);

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const makePrimary = (id: number) => {
    onChange([id, ...selected.filter((x) => x !== id)]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{selected.length} seçili</span>
      </div>
      {options.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{emptyText}</p>
      ) : (
        <div className="rounded-lg border border-slate-200">
          {options.length > 6 && (
            <div className="border-b border-slate-100 p-2">
              <Input placeholder="Ara..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
          <div className="max-h-40 divide-y divide-slate-50 overflow-y-auto">
            {filtered.map((o) => {
              const checked = selected.includes(o.id);
              const primary = selected[0] === o.id;
              return (
                <div
                  key={o.id}
                  className={clsx('flex items-center justify-between gap-2 px-3 py-2', checked && 'bg-brand-50/50')}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    <span className="truncate">{o.full_name}</span>
                  </label>
                  {checked && (
                    <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] text-slate-500">
                      <input
                        type="radio"
                        name={`primary-${label}`}
                        checked={primary}
                        onChange={() => makePrimary(o.id)}
                        className="h-3.5 w-3.5 text-brand-600"
                      />
                      Birincil
                    </label>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="px-3 py-3 text-xs text-slate-400">Sonuç yok.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
