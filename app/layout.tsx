import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocCraft',
  description: 'Browser-first modular business document studio.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
