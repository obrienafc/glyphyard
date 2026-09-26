// Builds a zip for static hosting, in the browser: the CSS and font files come
// from this instance's own /css2 and /s/ endpoints (so they're CDN-cached), and
// nothing extra runs on the server.
import type { Font } from './catalog';
import { cssFamily, cssUrl } from './fonts';

const MAX_FILES = 400;
const CONCURRENCY = 6;

export type DownloadProgress = { done: number; total: number };

function extension(contentType: string | null) {
  if (!contentType) return 'woff2';
  if (contentType.includes('woff2')) return 'woff2';
  if (contentType.includes('woff')) return 'woff';
  if (contentType.includes('ttf') || contentType.includes('truetype')) return 'ttf';
  if (contentType.includes('otf') || contentType.includes('opentype')) return 'otf';
  return 'woff2';
}

export async function buildStaticZip(
  specs: string[],
  fonts: Font[],
  sample: string,
  onProgress: (p: DownloadProgress) => void,
): Promise<{ blob: Blob; bytes: number; files: number }> {
  const res = await fetch(cssUrl('', specs));
  const css = await res.text();
  if (!res.ok) throw new Error(css.replace(/\/\*|\*\//g, '').trim() || `HTTP ${res.status}`);

  const urls = [...new Set([...css.matchAll(/url\((\/[sl]\/[^)]+)\)/g)].map((m) => m[1]))];
  if (urls.length === 0) throw new Error('No font files found for this selection.');
  if (urls.length > MAX_FILES) throw new Error(`That's ${urls.length} files. Pick fewer styles and try again.`);

  const files: Record<string, Uint8Array> = {};
  const renamed = new Map<string, string>();
  let done = 0;
  let bytes = 0;
  onProgress({ done, total: urls.length });

  const queue = urls.map((u, i) => [u, i] as const);
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [u, i] = item;
        const file = await fetch(u);
        if (!file.ok) throw new Error(`Couldn’t download a font file (HTTP ${file.status}).`);
        const data = new Uint8Array(await file.arrayBuffer());
        // /s/inter/v20/abc.woff2 -> fonts/inter/v20/abc.woff2
        const path = u.startsWith('/s/')
          ? `fonts/${u.slice(3).replace(/[?#].*$/, '')}`
          : `fonts/extra/file-${i}.${extension(file.headers.get('content-type'))}`;
        files[path] = data;
        renamed.set(u, path);
        bytes += data.byteLength;
        onProgress({ done: ++done, total: urls.length });
      }
    }),
  );

  let rewritten = css;
  for (const [from, to] of renamed) rewritten = rewritten.split(`url(${from})`).join(`url(${to})`);

  const enc = new TextEncoder();
  const families = fonts.map((f) => f.family);
  files['fonts.css'] = enc.encode(
    `/* ${families.join(', ')}\n   Self-hosted with Glyphyard (https://github.com/obrienafc/glyphyard).\n   Fonts are licensed by their authors: https://fonts.google.com/attribution */\n\n${rewritten}`,
  );
  files['README.txt'] = enc.encode(
    [
      'Self-hosted fonts from Glyphyard',
      '',
      `Families: ${families.join(', ')}`,
      '',
      'How to use',
      '1. Upload fonts.css and the fonts/ folder to your site, keeping them together.',
      '2. Add this to your <head>:  <link rel="stylesheet" href="/fonts.css">',
      '3. Use the fonts in your CSS:',
      ...fonts.map((f) => `     font-family: ${cssFamily(f)};`),
      '',
      'example.html shows every family. Open it in a browser from this folder.',
      '',
      'Licences',
      'These fonts are open source under their own licences (mostly the SIL Open Font',
      'License). See each family on Google Fonts:',
      ...families.map((f) => `  https://fonts.google.com/specimen/${f.replace(/ /g, '+')}`),
      '',
    ].join('\n'),
  );
  files['example.html'] = enc.encode(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${families.join(', ')}</title>
<link rel="stylesheet" href="fonts.css">
<style>body{margin:48px;max-width:860px;font:16px/1.5 system-ui,sans-serif;color:#1d1d1f}h2{margin:40px 0 4px;font:600 14px system-ui,sans-serif;color:#6e6e73}p{margin:0;font-size:40px;line-height:1.2}</style>
</head>
<body>
${fonts.map((f) => `<h2>${f.family}</h2>\n<p style="font-family: ${cssFamily(f).replace(/"/g, '&quot;')}">${sample.replace(/</g, '&lt;')}</p>`).join('\n')}
</body>
</html>
`);

  const { zipSync } = await import('fflate');
  // woff2 is already compressed, so store rather than deflate.
  const zipped = zipSync(files, { level: 0 });
  return { blob: new Blob([zipped as BlobPart], { type: 'application/zip' }), bytes, files: urls.length };
}
