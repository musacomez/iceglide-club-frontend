'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api/client';
import { api } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/AuthProvider';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth();
  const { push } = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function close() {
    if (!saving) onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError('');

    const fields = new FormData(event.currentTarget);
    const currentPassword = String(fields.get('current-password') ?? '');
    const newPassword = String(fields.get('new-password') ?? '');
    if (newPassword !== fields.get('confirm-password')) {
      setError('Yeni parola ve tekrarı eşleşmiyor.');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      push('Parolan değiştirildi. Yeni parolanla tekrar giriş yap.', 'success');
      onClose();
      logout();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        push('Oturumun sona erdi. Lütfen tekrar giriş yap.', 'info');
        onClose();
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Parola değiştirilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={close} title="Parolamı Değiştir">
      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={saving}>
        <Input label="Mevcut parola" name="current-password" type="password"
          autoComplete="current-password" required autoFocus readOnly={saving} />
        <Input label="Yeni parola" name="new-password" type="password"
          autoComplete="new-password" required readOnly={saving} aria-describedby="new-password-hint" />
        <p id="new-password-hint" className="text-sm text-slate-600">15 ile 128 karakter arasında olmalı.</p>
        <Input label="Yeni parola tekrar" name="confirm-password" type="password"
          autoComplete="new-password" required readOnly={saving} />
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>Vazgeç</Button>
          <Button type="submit" loading={saving}>Parolayı Değiştir</Button>
        </div>
      </form>
    </Modal>
  );
}
