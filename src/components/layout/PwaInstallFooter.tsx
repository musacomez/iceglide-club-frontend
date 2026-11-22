'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PwaInstallFooter() {
  const prompt = useRef<InstallPrompt | null>(null);
  const guide = useRef<HTMLDialogElement>(null);
  const [installed, setInstalled] = useState(false);
  const [appleMobile, setAppleMobile] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const syncMode = () => {
      const appleStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
      setInstalled(standalone.matches || appleStandalone === true);
    };
    const rememberPrompt = (event: Event) => {
      event.preventDefault();
      prompt.current = event as InstallPrompt;
    };
    const markInstalled = () => {
      prompt.current = null;
      guide.current?.close();
      setInstalled(true);
    };

    syncMode();
    standalone.addEventListener('change', syncMode);
    window.addEventListener('beforeinstallprompt', rememberPrompt);
    window.addEventListener('appinstalled', markInstalled);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/iceglide-sw.js').catch((error: unknown) => {
        console.warn('Atak Buz Sporları çevrimdışı ekranı kaydedilemedi.', error);
      });
    }

    return () => {
      standalone.removeEventListener('change', syncMode);
      window.removeEventListener('beforeinstallprompt', rememberPrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  async function install() {
    const request = prompt.current;
    if (request) {
      prompt.current = null;
      try {
        if ((await request.prompt()).outcome === 'accepted') setInstalled(true);
        return;
      } catch {
        // The browser can withdraw an install prompt. Show its menu instructions instead.
      }
    }
    setAppleMobile(isAppleMobile());
    guide.current?.showModal();
  }

  if (installed) return null;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 pt-2 text-center"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <Button type="button" variant="ghost" className="min-h-11" onClick={install}>
        Uygulamayı Kur
      </Button>
      <dialog ref={guide} aria-labelledby="atak-install-title"
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-5 text-left text-slate-900 shadow-popover backdrop:bg-slate-900/50">
        <h2 id="atak-install-title" className="text-lg font-semibold">Atak Buz Sporları’nı ana ekrana ekle</h2>
        {appleMobile ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Bu sayfayı Safari’de aç.</li>
            <li><strong>Paylaş</strong> menüsünden <strong>Ana Ekrana Ekle</strong> seçeneğine dokun.</li>
            <li>Varsa <strong>Web Uygulaması Olarak Aç</strong> seçeneğini etkinleştir ve <strong>Ekle</strong>’ye dokun.</li>
          </ol>
        ) : (
          <p className="mt-3 text-sm text-slate-700">
            Chrome veya Edge menüsünden <strong>Uygulamayı yükle</strong> ya da <strong>Ana ekrana ekle</strong> seçeneğini kullan.
          </p>
        )}
        <form method="dialog" className="mt-4 flex justify-end">
          <Button type="submit" variant="secondary" autoFocus>Tamam</Button>
        </form>
      </dialog>
    </footer>
  );
}
