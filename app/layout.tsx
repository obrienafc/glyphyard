import type { Metadata, Viewport } from 'next';
import { instanceName } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: instanceName,
  description: 'Every font you need, served from your own domain. No tracking, no cookies.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
