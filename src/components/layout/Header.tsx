'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ROLE_LABEL } from '@/lib/auth/roles';
import { initials } from '@/lib/utils/format';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SidebarNav, LogoMark } from './Sidebar';
import type { NavItem } from '@/lib/auth/roles';

export function Header({ title, items }: { title: string; items: NavItem[] }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const mobileNav = useRef<HTMLDialogElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) mobileNav.current?.close();
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 hover:bg-brand-100 lg:hidden"
          onClick={() => {
            mobileNav.current?.showModal();
            setMobileNavOpen(true);
          }}
          aria-label="Menüyü aç"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-navigation"
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
          aria-label="Hesap menüsü"
          aria-expanded={menuOpen}
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
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setPasswordOpen(true);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              Parolamı Değiştir
            </button>
            <button
              onClick={logout}
              className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      <dialog
        ref={mobileNav}
        id="mobile-navigation"
        aria-label="Ana menü"
        onClose={() => setMobileNavOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) mobileNav.current?.close();
        }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-slate-950/50"
      >
          <div className="flex h-full w-[min(20rem,calc(100%-2rem))] flex-col gap-5 overflow-y-auto overscroll-contain bg-white py-5 shadow-popover">
            <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-3 pb-4">
              <LogoMark />
              <button
                type="button"
                onClick={() => mobileNav.current?.close()}
                aria-label="Menüyü kapat"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-brand-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SidebarNav items={items} onNavigate={() => mobileNav.current?.close()} />
          </div>
      </dialog>
      {passwordOpen && createPortal(
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />,
        document.body,
      )}
    </header>
  );
}
