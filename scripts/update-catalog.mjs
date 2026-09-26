// Fetches the Google Fonts family list and writes a trimmed snapshot to
// data/catalog.json. Runs before every build. If Google can't be reached the
// committed snapshot is kept, so builds never fail because of this step.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../data/catalog.json', import.meta.url));

try {
  const res = await fetch('https://fonts.google.com/metadata/fonts', {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // The endpoint has historically been prefixed with an XSSI guard.
  const { familyMetadataList } = JSON.parse(text.replace(/^\)\]\}'\s*/, ''));

  const fonts = familyMetadataList
    .map((f) => {
      const wght = (f.axes ?? []).find((a) => a.tag === 'wght');
      return {
        family: f.family,
        category: f.category,
        popularity: f.popularity,
        added: f.dateAdded,
        styles: Object.keys(f.fonts).sort(styleOrder),
        ...(wght ? { variable: [wght.min, wght.max] } : {}),
        subsets: (f.subsets ?? []).filter((s) => s !== 'menu'),
      };
    })
    .filter((f) => f.styles.length > 0)
    .sort((a, b) => a.popularity - b.popularity);

  if (fonts.length < 500) throw new Error(`only ${fonts.length} families, refusing to overwrite`);

  await writeFile(out, JSON.stringify({ updated: new Date().toISOString(), fonts }));
  console.log(`glyphyard: catalog updated (${fonts.length} families)`);
} catch (err) {
  console.warn(`glyphyard: could not refresh catalog, using committed snapshot (${err.message})`);
}

function styleOrder(a, b) {
  const ai = a.endsWith('i');
  const bi = b.endsWith('i');
  if (ai !== bi) return ai ? 1 : -1;
  return parseInt(a) - parseInt(b);
}
