'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ROLE_LABEL } from '@/lib/auth/roles';
import { initials } from '@/lib/utils/format';
import { SidebarNav, LogoMark } from './Sidebar';
import type { NavItem } from '@/lib/auth/roles';

export function Header({ title, items }: { title: string; items: NavItem[] }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Menüyü aç"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {user ? initials(user.full_name) : '..'}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-slate-800">{user?.full_name}</span>
            <span className="block text-xs text-slate-400">{user && ROLE_LABEL[user.role]}</span>
          </span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-popover">
            <button
              onClick={logout}
              className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-72 flex-col gap-6 bg-white py-6 shadow-popover flex">
            <div className="flex items-center justify-between px-3">
              <LogoMark />
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Kapat"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SidebarNav items={items} onNavigate={() => setMobileNavOpen(false)} />
          </div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}
    </header>
  );
}
