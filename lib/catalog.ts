import snapshot from '@/data/catalog.json';
import { allowedFamilies, normalize } from './config';

export type Font = {
  family: string;
  category: string;
  popularity: number;
  added: string;
  /** Style keys as Google names them: "400", "700i", ... */
  styles: string[];
  /** [min, max] of the wght axis for variable fonts. */
  variable?: [number, number];
  subsets: string[];
};

export function getCatalog(): { updated: string; fonts: Font[] } {
  const fonts = (snapshot.fonts as Font[]).filter(
    (f) => !allowedFamilies || allowedFamilies.has(normalize(f.family)),
  );
  return { updated: snapshot.updated, fonts };
}
