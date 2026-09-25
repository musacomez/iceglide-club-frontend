'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ROLE_HOME, navForRole } from '@/lib/auth/roles';
import type { UserRole } from '@/types/api';
import { AppShell } from './AppShell';

// Guards a role's route subtree on the client. If the signed-in user's role
// (from /api/me) doesn't match, redirect to their own home - a user without
// the UI for a route could still hit the API directly, but the Worker's own
// withRoles()/canAccessX() checks are what actually block that.
export function RoleGuard({
  role,
  title,
  children,
}: {
  role: UserRole | UserRole[];
  title: string;
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    else if (status === 'authenticated' && user && !allowed.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  if (status === 'loading' || !user || !allowed.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell title={title} navItems={navForRole(user.role)}>
      {children}
    </AppShell>
  );
}
