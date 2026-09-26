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
