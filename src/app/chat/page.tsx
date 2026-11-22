'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ROLE_HOME, ROLE_LABEL } from '@/lib/auth/roles';
import clsx from '@/lib/utils/clsx';
import type { ClubMessage, ClubMessagePage } from '@/types/club-chat';
import type { UserRole } from '@/types/api';

const roles = Object.keys(ROLE_HOME) as UserRole[];
const time = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul',
});

function ClubChat() {
  const { user } = useAuth();
  const [page, setPage] = useState<ClubMessagePage | null>(null);
  const [before, setBefore] = useState<number>();
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [moderation, setModeration] = useState<ClubMessage | null>(null);
  const [moderationError, setModerationError] = useState('');
  const [hiding, setHiding] = useState(false);
  const requestVersion = useRef(0);
  const messageList = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const next = await api.listClubMessages(before);
      if (version !== requestVersion.current) return;
      setPage(next);
      setLoadError('');
    } catch (err) {
      if (version === requestVersion.current) {
        setLoadError(err instanceof Error ? err.message : 'Sohbet yüklenemedi.');
      }
    }
  }, [before]);

  useEffect(() => {
    void load();
    if (before !== undefined) return () => { requestVersion.current++; };
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 12_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      requestVersion.current++;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [before, load]);

  useEffect(() => {
    const list = messageList.current;
    if (list && before === undefined && followLatest.current) list.scrollTop = list.scrollHeight;
  }, [page, before]);

  function navigate(cursor?: number) {
    followLatest.current = cursor === undefined;
    requestVersion.current++;
    setPage(null);
    setLoadError('');
    setBefore(cursor);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || message.length > 1000 || sending) return;
    setSending(true);
    setSendError('');
    try {
      await api.sendClubMessage(message);
      setDraft('');
      followLatest.current = true;
      if (before === undefined) await load();
      else navigate();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  }

  async function hide() {
    if (!moderation || hiding) return;
    setHiding(true);
    setModerationError('');
    try {
      await api.hideClubMessage(moderation.id);
      setModeration(null);
      await load();
    } catch (err) {
      setModerationError(err instanceof Error ? err.message : 'Mesaj gizlenemedi.');
    } finally {
      setHiding(false);
    }
  }

  return (
    <Card className="mx-auto flex max-w-4xl flex-col">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <p className="text-sm text-slate-700">Bu oda, giriş yapmış tüm kulüp üyelerine açıktır.</p>
      </div>
      <div className="flex flex-wrap justify-between gap-2 px-4 pt-3 sm:px-5">
        {page?.next_before != null && (
          <Button type="button" size="sm" variant="outline" disabled={sending || hiding} onClick={() => navigate(page.next_before ?? undefined)}>
            Önceki Mesajlar
          </Button>
        )}
        {before !== undefined && (
          <Button type="button" size="sm" variant="ghost" disabled={sending || hiding} onClick={() => navigate()}>Son Mesajlara Dön</Button>
        )}
      </div>
      {loadError && (
        <div className="flex flex-wrap items-center gap-2 px-4 text-sm text-rose-700">
          <span role="alert">{loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={load}>Tekrar Dene</Button>
        </div>
      )}
      <div ref={messageList} role="region" aria-label="Mesajlar" tabIndex={0}
        className="min-h-48 max-h-[52dvh] space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5"
        onScroll={(event) => {
          const list = event.currentTarget;
          followLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight < 56;
        }}>
        {!page && !loadError && <p role="status" className="text-sm text-slate-500">Mesajlar yükleniyor…</p>}
        {page?.messages.length === 0 && <p className="text-sm text-slate-500">Bu bölümde mesaj yok.</p>}
        {page?.messages.map((row) => (
          <article key={row.id} className={clsx('rounded-xl border px-3 py-2.5',
            row.author_id === user?.id ? 'border-brand-100 bg-brand-50' : 'border-slate-100 bg-slate-50')}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-slate-600">
              <strong className="break-all text-sm text-slate-900">{row.author_name}</strong>
              <span>{ROLE_LABEL[row.author_role]}</span>
              <time dateTime={row.created_at.replace(' ', 'T') + 'Z'}>
                {time.format(new Date(row.created_at.replace(' ', 'T') + 'Z'))}
              </time>
              {user?.role === 'admin' && (
                <Button type="button" size="sm" variant="ghost" className="ml-auto"
                  aria-label={`${row.author_name} adlı üyenin mesajını gizle`}
                  onClick={() => { setModerationError(''); setModeration(row); }}>Gizle</Button>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{row.message}</p>
          </article>
        ))}
      </div>
      <form onSubmit={send} className="grid gap-2 border-t border-slate-100 p-4 sm:p-5">
        <Textarea name="club-message" label="Mesajın" value={draft} maxLength={1000}
          rows={2} readOnly={sending} onChange={(event) => setDraft(event.target.value)} />
        {sendError && <p role="alert" className="text-sm text-rose-700">{sendError}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-slate-600">{draft.length}/1.000</span>
          <Button type="submit" loading={sending} disabled={!draft.trim()}>Gönder</Button>
        </div>
      </form>
      {moderation && (
        <Modal open title="Mesajı gizle" onClose={() => { if (!hiding) setModeration(null); }}>
          <p className="text-sm text-slate-700">Mesaj tüm üyeler için sohbetten kaldırılacak.</p>
          <p className="my-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm">{moderation.message}</p>
          {moderationError && <p role="alert" className="text-sm text-rose-700">{moderationError}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={hiding} onClick={() => setModeration(null)}>Vazgeç</Button>
            <Button type="button" variant="danger" loading={hiding} onClick={hide}>Mesajı Gizle</Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function ClubChatPage() {
  return <RoleGuard role={roles} title="Kulüp Sohbeti"><ClubChat /></RoleGuard>;
}
