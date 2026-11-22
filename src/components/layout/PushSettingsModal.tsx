'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api/endpoints';
import { pushBrowserSupported } from '@/lib/push-device';

type PushConfig = {
  registration: ServiceWorkerRegistration;
  publicKey: string | null;
};

function keyBytes(key: string) {
  return Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (code) => code.charCodeAt(0));
}

export function PushSettingsModal({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!pushBrowserSupported()) throw new Error('iPhone veya iPad kullanıyorsan Atak Buz Sporları’nı ana ekrana ekleyip simgeden aç.');
        const [settings, registration] = await Promise.all([
          api.pushSettings(), navigator.serviceWorker.getRegistration(),
        ]);
        if (!registration?.active) throw new Error('Uygulamayı yeniden açıp tekrar dene.');
        const current = await registration.pushManager.getSubscription();
        if (!mounted) return;
        setConfig({ registration, publicKey: settings.public_key });
        setSubscription(current);
      } catch (error) {
        if (mounted) setMessage(error instanceof Error ? error.message : 'Bildirim ayarları yüklenemedi.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function enable() {
    if (!config?.publicKey || busy) return;
    setBusy(true);
    setMessage('');
    try {
      // iOS associates the permission prompt with this click.
      const current = subscription ?? await config.registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: keyBytes(config.publicKey),
      });
      setSubscription(current);
      await api.savePushDevice(current.toJSON());
      setMessage('Bu cihazda bildirimler hesabın için açıldı.');
    } catch (error) {
      setMessage(Notification.permission === 'denied'
        ? 'İzin kapalı. Telefonunun bildirim ayarlarından Atak Buz Sporları’na izin ver.'
        : error instanceof Error ? error.message : 'Bildirimler açılamadı.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!subscription || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await api.deletePushDevice(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage('Bu cihazda bildirimler kapatıldı.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bildirimler kapatılamadı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title="Telefon Bildirimleri" onClose={() => { if (!busy) onClose(); }}>
      <div className="grid gap-3 text-sm text-slate-700">
        <p>Bu cihazda kulüp haberlerini ve hesabına ait hatırlatmaları al.</p>
        {loading && <p role="status">Bildirim ayarları yükleniyor…</p>}
        {!loading && config?.publicKey === null && <p>Telefon bildirimleri henüz yapılandırılmadı.</p>}
        {message && <p role="status">{message}</p>}
        <div className="flex flex-wrap gap-2">
          {config?.publicKey && (
            <Button type="button" disabled={busy} onClick={enable}>
              {subscription ? 'Bu Hesap İçin Bildirimleri Etkinleştir' : 'Bildirimleri Aç'}
            </Button>
          )}
          {subscription && (
            <Button type="button" variant="outline" disabled={busy} onClick={disable}>Bildirimleri Kapat</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
