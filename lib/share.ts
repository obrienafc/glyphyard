// Shareable links. A selection is encoded as repeated `f` parameters:
//   ?f=Inter:400,700,400i&f=Lora:400:v     (":v" = full variable range)
// and a pairing as `pair=Heading|Body`.
import type { Font } from './catalog';
import type { Selection } from './fonts';

export function encodeSelection(selection: Selection) {
  return Object.entries(selection).map(
    ([family, { styles, variable }]) => `${family}:${styles.join(',')}${variable ? ':v' : ''}`,
  );
}

export function decodeSelection(values: string[], byFamily: Map<string, Font>): Selection {
  const selection: Selection = {};
  for (const value of values) {
    const [family, styleList = '', flag] = value.split(':');
    const font = byFamily.get(family);
    if (!font) continue;
    const styles = styleList.split(',').filter((s) => font.styles.includes(s));
    if (styles.length) selection[font.family] = { styles, variable: flag === 'v' && !!font.variable };
  }
  return selection;
}

export function shareUrl(origin: string, params: { selection?: Selection; pair?: [string, string] }) {
  const url = new URL('/', origin);
  for (const f of encodeSelection(params.selection ?? {})) url.searchParams.append('f', f);
  if (params.pair) url.searchParams.set('pair', params.pair.join('|'));
  return url.toString();
}
