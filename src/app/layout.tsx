import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { PwaInstallFooter } from '@/components/layout/PwaInstallFooter';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Atak Buz Sporları',
  description: 'Atak Buz Sporları Kulüp Yönetim Sistemi',
  manifest: '/pwa/manifest.webmanifest',
  icons: { apple: '/pwa/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Atak Buz Sporları', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#2547df' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col font-sans antialiased text-slate-900">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
        <PwaInstallFooter />
      </body>
    </html>
  );
}
