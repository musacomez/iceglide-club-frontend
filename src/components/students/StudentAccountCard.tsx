'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api/endpoints';

type Account = Awaited<ReturnType<typeof api.getStudentAccount>>;

export function StudentAccountCard({ studentId }: { studentId: number }) {
  const { push } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoadError('');
    try {
      setAccount(await api.getStudentAccount(studentId));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Giriş hesabı yüklenemedi.');
    }
  }, [studentId]);

  useEffect(() => { void load(); }, [load]);

  const create = account?.email === null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || saving) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('account-email') ?? '').trim();
    const password = String(fields.get('account-password') ?? '');
    if (password !== fields.get('account-confirm')) {
      setFormError('Parolalar eşleşmiyor.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      setAccount(await api.saveStudentAccount(studentId, create, { email, ...(password ? { password } : {}) }));
      setEditing(false);
      push(create ? 'Öğrenci giriş hesabı oluşturuldu.' : 'Öğrenci giriş hesabı güncellendi.', 'success');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Giriş hesabı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Giriş Hesabı" action={account && !loadError && (
        <Button size="sm" type="button" onClick={() => { setFormError(''); setEditing(true); }}>
          {create ? 'Hesap Oluştur' : 'E-posta ve Parolayı Düzenle'}
        </Button>
      )} />
      {loadError ? <ErrorState message={loadError} onRetry={load} /> : (
        <div className="px-5 py-4 text-sm text-slate-700">
          {!account ? <p role="status">Hesap yükleniyor…</p> : create
            ? <p>Bu öğrenci için henüz giriş hesabı oluşturulmadı.</p>
            : <><p className="break-all font-semibold">{account.email}</p>
                {account.active === false && <p className="mt-1">Hesap pasif.</p>}</>}
        </div>
      )}
      {editing && account && (
        <Modal open title={create ? 'Öğrenci Giriş Hesabı Oluştur' : 'Öğrenci Giriş Hesabını Düzenle'}
          onClose={() => { if (!saving) setEditing(false); }}>
          <form className="grid gap-4" onSubmit={submit}>
            <Input type="email" name="account-email" label="Giriş e-postası" defaultValue={account.email ?? ''}
              autoComplete="off" maxLength={254} required readOnly={saving} />
            <Input type="password" name="account-password" label={create ? 'İlk parola' : 'Yeni parola'}
              autoComplete="new-password" required={create} readOnly={saving} aria-describedby="student-password-hint" />
            <Input type="password" name="account-confirm" label="Parolayı tekrar yaz"
              autoComplete="new-password" required={create} readOnly={saving} />
            <p id="student-password-hint" className="text-sm text-slate-600">
              Parola 15 ile 128 karakter arasında olmalı.
              {!create && ' Sadece e-postayı güncellemek için parola alanlarını boş bırakabilirsin.'}
            </p>
            {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" disabled={saving} onClick={() => setEditing(false)}>Vazgeç</Button>
              <Button type="submit" loading={saving}>Kaydet</Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
