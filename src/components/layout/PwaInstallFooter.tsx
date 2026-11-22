'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PwaInstallFooter() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [appleMobile, setAppleMobile] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    setAppleMobile(isAppleMobile());
    const standalone = window.matchMedia('(display-mode: standalone)');
    const syncMode = () => {
      const appleStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
      setInstalled(standalone.matches || appleStandalone === true);
    };
    const rememberPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const markInstalled = () => {
      setPrompt(null);
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
    if (!prompt) return;
    try {
      if ((await prompt.prompt()).outcome === 'accepted') setInstalled(true);
    } catch {
      setGuideOpen(true);
    } finally {
      setPrompt(null);
    }
  }

  if (installed) return null;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 pt-2 text-center"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {prompt && !appleMobile ? (
        <Button type="button" variant="ghost" className="min-h-11" onClick={install}>
          Uygulamayı Kur
        </Button>
      ) : (
        <details className="relative mx-auto w-fit" open={guideOpen}
          onToggle={(event) => setGuideOpen(event.currentTarget.open)}>
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
            {appleMobile ? 'iPhone / iPad Kurulum Adımları' : 'Uygulamayı Kur'}
          </summary>
          <div className="absolute bottom-full left-1/2 z-40 mb-2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-popover">
            <h2 className="font-semibold">Atak Buz Sporları’nı ana ekrana ekle</h2>
            <p className="mt-2 text-sm text-slate-700">
              <strong>iPhone / iPad:</strong> Safari’de <strong>Paylaş → Ana Ekrana Ekle</strong>’ye dokun.
              Varsa <strong>Web Uygulaması Olarak Aç</strong> seçeneğini aç, ardından <strong>Ekle</strong>’ye dokun.
            </p>
            {!appleMobile && (
              <p className="mt-2 text-sm text-slate-700">
                <strong>Android / bilgisayar:</strong> Chrome veya Edge menüsünden <strong>Uygulamayı yükle</strong> ya da{' '}
                <strong>Ana ekrana ekle</strong> seçeneğini kullan.
              </p>
            )}
          </div>
        </details>
      )}
    </footer>
  );
}
