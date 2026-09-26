export const instanceName = process.env.GLYPHYARD_NAME?.trim() || 'Glyphyard';

/** Families this instance may serve, or null when every Google Font is allowed. */
export const allowedFamilies: Set<string> | null = (() => {
  const raw = process.env.GLYPHYARD_FAMILIES?.trim();
  if (!raw) return null;
  return new Set(raw.split(',').map(normalize).filter(Boolean));
})();

export function normalize(family: string) {
  return family.trim().toLowerCase().replace(/[\s+]+/g, ' ');
}

/** Google's file paths use the family name lowercased with spaces removed. */
export function slug(family: string) {
  return normalize(family).replace(/ /g, '');
}

export function isFamilyAllowed(family: string) {
  return !allowedFamilies || allowedFamilies.has(normalize(family));
}

/**
 * Sites allowed to embed this instance's fonts, as hostname suffixes
 * ("patrickob.tech" also allows "www.patrickob.tech"). Null allows any site.
 * Set this on a public demo so it can't be used as a free font CDN.
 */
export const embedOrigins: string[] | null = (() => {
  const raw = process.env.GLYPHYARD_ALLOWED_ORIGINS?.trim();
  if (!raw) return null;
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);
})();

/** Show a Spillcheck privacy badge in the footer. Opt-in, since it loads an image from Spillcheck. */
export const showSpillcheckBadge = process.env.GLYPHYARD_SPILLCHECK_BADGE === '1';

/**
 * Whether the page asking for fonts may use them. Requests without an Origin
 * or Referer (privacy tools, curl) are allowed: this deters hotlinking by other
 * sites, whose visitors' browsers do send them.
 */
export function isEmbedAllowed(request: Request) {
  if (!embedOrigins) return true;
  const source = request.headers.get('origin') ?? request.headers.get('referer');
  if (!source || source === 'null') return true;
  let host: string;
  try {
    host = new URL(source).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === new URL(request.url).hostname || host === 'localhost' || host === '127.0.0.1') return true;
  return embedOrigins.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
