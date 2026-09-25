'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { clearToken, getToken, setToken } from '@/lib/api/client';
import { ROLE_HOME } from '@/lib/auth/roles';
import type { Me } from '@/types/api';

interface AuthContextValue {
  user: Me | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      setStatus('authenticated');
    } catch {
      clearToken();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const result = await api.login(email, password);
        setToken(result.token);
        const me = await api.me();
        setUser(me);
        setStatus('authenticated');
        router.replace(ROLE_HOME[me.role]);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Sunucuya bağlanılamadı.';
        setError(message);
        throw err;
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('unauthenticated');
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, status, error, login, logout, refresh }),
    [user, status, error, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
