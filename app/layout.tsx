import type { Metadata } from 'next';
import Script from 'next/script';
import { LocaleProvider } from '../src/i18n/locale-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocCraft',
  description: 'Browser-first modular business document studio.',
  robots: 'noindex, nofollow, noarchive',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <Script src="/doccraft-locale-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
