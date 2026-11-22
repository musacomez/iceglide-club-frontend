'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api/endpoints';

export function StudentNotificationButton({ studentId }: { studentId: number }) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await api.notifyStudent(studentId);
      setOpen(false);
      push('Bildirim gönderim sırasına alındı.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bildirim gönderilemedi.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setError(''); setOpen(true); }}>
        Bildirim Gönder
      </Button>
      {open && (
        <Modal open title="Öğrenciye Bildirim Gönder" onClose={() => { if (!sending) setOpen(false); }}>
          <p className="text-sm text-slate-700">Bu öğrencinin etkin cihazlarına “Kulübünden bir bildirim var.” bildirimi gönderilecek.</p>
          {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={sending} onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="button" loading={sending} onClick={send}>Gönder</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
