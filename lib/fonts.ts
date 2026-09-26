// Helpers shared by the picker UI. No server-only imports here.
import type { Font } from './catalog';

export type Selection = Record<string, { styles: string[]; variable: boolean }>;

const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
  1000: 'ExtraBlack',
};

export const weightOf = (style: string) => parseInt(style, 10);
export const isItalic = (style: string) => style.endsWith('i');

export function styleLabel(style: string) {
  const w = weightOf(style);
  const name = WEIGHT_NAMES[w] ?? '';
  const label = !isItalic(style) ? name : name === 'Regular' ? 'Italic' : `${name} Italic`;
  return `${label} ${w}`.trim();
}

export function defaultStyle(font: Font) {
  return font.styles.includes('400') ? '400' : font.styles[0];
}

function familyParam(family: string) {
  return encodeURIComponent(family).replace(/%20/g, '+');
}

/**
 * Builds one css2 `family=` value. Google rejects tuples that aren't sorted,
 * so roman styles come first, then italics, each in ascending weight.
 */
export function familySpec(font: Font, styles: string[], variable = false) {
  const name = familyParam(font.family);
  const roman = styles.filter((s) => !isItalic(s));
  const italic = styles.filter(isItalic);

  if (variable && font.variable) {
    const range = `${font.variable[0]}..${font.variable[1]}`;
    if (italic.length === 0) return `${name}:wght@${range}`;
    const tuples = [roman.length ? `0,${range}` : null, `1,${range}`].filter(Boolean);
    return `${name}:ital,wght@${tuples.join(';')}`;
  }

  const byWeight = (a: string, b: string) => weightOf(a) - weightOf(b);
  if (italic.length === 0) {
    if (roman.length === 1 && roman[0] === '400') return name;
    return `${name}:wght@${roman.sort(byWeight).map(weightOf).join(';')}`;
  }
  const tuples = [
    ...roman.sort(byWeight).map((s) => `0,${weightOf(s)}`),
    ...italic.sort(byWeight).map((s) => `1,${weightOf(s)}`),
  ];
  return `${name}:ital,wght@${tuples.join(';')}`;
}

export function cssUrl(origin: string, specs: string[], display = 'swap') {
  return `${origin}/css2?${specs.map((s) => `family=${s}`).join('&')}&display=${display}`;
}

export function fallbackFor(category: string) {
  switch (category) {
    case 'Serif':
      return 'serif';
    case 'Monospace':
      return 'monospace';
    case 'Handwriting':
      return 'cursive';
    default:
      return 'sans-serif';
  }
}

export function cssFamily(font: Font) {
  return `'${font.family.replace(/'/g, "\\'")}', ${fallbackFor(font.category)}`;
}

// --- Preview loading -------------------------------------------------------
// Every preview goes through this instance's own /css2, so browsing the
// catalog never contacts Google directly either.

const requested = new Set<string>();

export function loadPreview(spec: string): Promise<void> {
  const href = cssUrl('', [spec], 'block');
  if (requested.has(href)) return Promise.resolve();
  requested.add(href);
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}
