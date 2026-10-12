import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { THEME_KEY } from '@/lib/theme';
import { instanceName, isFamilyAllowed } from '@/lib/config';
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
    // The inline script sets data-theme before hydration, so React is told not to mind.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        {/* The UI font on Windows and other non-Apple systems, served by this instance
            itself. Skipped when GLYPHYARD_FAMILIES leaves Inter out; Segoe UI is next. */}
        {isFamilyAllowed('Inter') && (
          <link rel="stylesheet" href="/css2?family=Inter:wght@400;500;600;700&display=swap" />
        )}
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
