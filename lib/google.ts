import { allowedFamilies, embedOrigins, isEmbedAllowed, isFamilyAllowed, slug } from './config';

const CSS_ORIGIN = 'https://fonts.googleapis.com';
const FILE_ORIGIN = 'https://fonts.gstatic.com';

// Google tailors its CSS to the requesting browser. We always ask as a modern
// browser so the response is woff2 with unicode-range subsets, which every
// browser from the last several years supports. It also means the CSS is
// the same for every visitor and caches well.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// With an embed allowlist, the CDN must cache per requesting site, not share
// one response between an allowed site and a disallowed one.
const VARY: Record<string, string> = embedOrigins ? { Vary: 'Origin, Referer' } : {};

const DEMO_MESSAGE =
  'this instance only serves fonts to its own sites. Deploy your own Glyphyard for free: https://github.com/obrienafc/glyphyard';

/** Family names requested by a css or css2 query string. */
function requestedFamilies(api: 'css' | 'css2', params: URLSearchParams) {
  const values = params.getAll('family');
  const specs = api === 'css' ? values.flatMap((v) => v.split('|')) : values;
  return specs.map((s) => s.split(':')[0]).filter(Boolean);
}

function cssError(status: number, message: string) {
  return new Response(`/* Glyphyard: ${message} */\n`, {
    status,
    headers: { 'Content-Type': 'text/css; charset=utf-8', ...CORS, ...VARY },
  });
}

/**
 * Proxies Google's /css or /css2 endpoint and rewrites every font URL so the
 * files are served from this instance's own domain.
 */
export async function proxyCss(api: 'css' | 'css2', request: Request) {
  const params = new URL(request.url).searchParams;
  const families = requestedFamilies(api, params);

  if (!isEmbedAllowed(request)) return cssError(403, DEMO_MESSAGE);
  if (families.length === 0) return cssError(400, 'missing family parameter');

  const blocked = families.filter((f) => !isFamilyAllowed(f));
  if (blocked.length) return cssError(403, `not served by this instance: ${blocked.join(', ')}`);

  let upstream: Response;
  try {
    upstream = await fetch(`${CSS_ORIGIN}/${api}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });
  } catch {
    return cssError(502, 'could not reach Google Fonts');
  }

  if (!upstream.ok) {
    const reason =
      upstream.status === 400
        ? 'Google Fonts rejected this request. Check the family names and that each font has the weights/styles asked for.'
        : `Google Fonts returned HTTP ${upstream.status}`;
    return cssError(upstream.status, reason);
  }
  const body = await upstream.text();

  // Root-relative URLs resolve against the stylesheet's own origin, so this
  // works on any domain without knowing the hostname.
  const css = body.replaceAll(FILE_ORIGIN, '');

  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      ...CORS,
      ...VARY,
    },
  });
}

/** Proxies a font file from fonts.gstatic.com. Paths there are versioned, so they never change. */
export async function proxyFile(request: Request) {
  const url = new URL(request.url);
  if (!isEmbedAllowed(request)) {
    return new Response('Forbidden: ' + DEMO_MESSAGE, { status: 403, headers: { ...CORS, ...VARY } });
  }

  if (allowedFamilies) {
    // Paths look like /s/<family-slug>/v20/<hash>.woff2
    const [, kind, familySlug] = url.pathname.split('/');
    const allowed = [...allowedFamilies].some((f) => slug(f) === familySlug);
    if (kind !== 's' || !allowed) return new Response('Not found', { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${FILE_ORIGIN}${url.pathname}${url.search}`, { cache: 'no-store' });
  } catch {
    return new Response('Bad gateway', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'font/woff2',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...CORS,
      ...VARY,
    },
  });
}
