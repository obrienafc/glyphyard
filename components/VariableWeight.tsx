'use client';

import { useEffect, useState } from 'react';
import type { Font } from '@/lib/catalog';
import { cssFamily, familySpec, isItalic, loadPreview } from '@/lib/fonts';

const NAMES: [number, string][] = [
  [100, 'Thin'],
  [200, 'ExtraLight'],
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
  [700, 'Bold'],
  [800, 'ExtraBold'],
  [900, 'Black'],
];

const nameFor = (w: number) => NAMES.reduce((best, n) => (Math.abs(n[0] - w) < Math.abs(best[0] - w) ? n : best))[1];

/** Live preview of any weight in a variable font's range. */
export function VariableWeight({
  font,
  text,
  rangeEmbedded,
}: {
  font: Font;
  text: string;
  rangeEmbedded: boolean;
}) {
  const [min, max] = font.variable!;
  const hasItalic = font.styles.some(isItalic);
  const [weight, setWeight] = useState(Math.min(Math.max(400, min), max));
  const [italic, setItalic] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the whole range (and italics, if any) once.
  useEffect(() => {
    let cancelled = false;
    const spec = familySpec(font, hasItalic ? ['400', '400i'] : ['400'], true);
    loadPreview(spec)
      .then(() => document.fonts.load(`${weight} 16px ${cssFamily(font)}`))
      .catch(() => {})
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font]);

  return (
    <section className="variable" aria-label="Variable weight">
      <div className="variable-head">
        <label htmlFor="weight">Weight</label>
        <output htmlFor="weight">
          {weight} <span className="muted">{nameFor(weight)}</span>
        </output>
        {hasItalic && (
          <label className="check small-check">
            <input type="checkbox" checked={italic} onChange={(e) => setItalic(e.target.checked)} />
            Italic
          </label>
        )}
      </div>
      <p
        className="variable-sample"
        data-ready={ready}
        style={{ fontFamily: cssFamily(font), fontWeight: weight, fontStyle: italic ? 'italic' : 'normal' }}
      >
        {text}
      </p>
      <input
        id="weight"
        className="variable-range"
        type="range"
        min={min}
        max={max}
        step={1}
        value={weight}
        onChange={(e) => setWeight(Number(e.target.value))}
      />
      <div className="variable-scale" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <p className="muted variable-hint">
        {rangeEmbedded
          ? `The full range is in your embed code, so any weight works: font-weight: ${weight};`
          : `Turn on Full variable range to use any weight like ${weight} in your CSS.`}
      </p>
    </section>
  );
}
