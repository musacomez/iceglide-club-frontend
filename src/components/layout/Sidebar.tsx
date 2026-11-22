'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from '@/lib/utils/clsx';
import type { NavItem } from '@/lib/auth/roles';

function LogoMark() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 2v20M5 7l7-5 7 5M5 17l7 5 7-5M2 12h20"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">Atak Buz Sporları</p>
        <p className="text-xs text-slate-600">Kulüp Yönetimi</p>
      </div>
    </div>
  );
}

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = items.reduce<NavItem | undefined>((match, item) =>
    (pathname === item.href || pathname?.startsWith(`${item.href}/`)) &&
    (!match || item.href.length > match.href.length) ? item : match, undefined);
  return (
    <nav aria-label="Ana menü" className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = item === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={clsx(
              'rounded-lg px-3 py-3 text-sm font-semibold transition-colors lg:py-2.5',
              active ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-800',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-brand-100 bg-white px-2 py-6 lg:flex">
      <LogoMark />
      <SidebarNav items={items} />
    </aside>
  );
}

export { LogoMark };
