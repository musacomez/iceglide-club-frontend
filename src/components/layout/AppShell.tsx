'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { NavItem } from '@/lib/auth/roles';

export function AppShell({
  title,
  navItems,
  children,
}: {
  title: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} items={navItems} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
