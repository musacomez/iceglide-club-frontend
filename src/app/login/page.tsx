'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionDestination } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { login, user, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(sessionDestination(user.role, new URLSearchParams(window.location.search).get('next')));
    }
  }, [router, status, user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) return setFormError('E-posta adresi zorunludur.');
    if (!password) return setFormError('Parola zorunludur.');

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      setFormError('Başarısız giriş. E-posta veya parolanızı kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-ice-50 to-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
              <path
                d="M12 2v20M5 7l7-5 7 5M5 17l7 5 7-5M2 12h20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Atak Buz Sporları</h1>
            <p className="text-sm text-slate-500">Kulüp yönetim sistemine giriş yapın</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <Input
            label="E-posta"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@example.com"
          />
          <Input
            label="Parola"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {formError && <p className="text-sm text-rose-600">{formError}</p>}
          <Button type="submit" loading={submitting} className="mt-1 w-full">
            Giriş Yap
          </Button>
        </form>
      </div>
    </div>
  );
}
