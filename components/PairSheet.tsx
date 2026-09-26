'use client';

import { ArrowLeftRight, Check, Link as LinkIcon, Plus } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { Font } from '@/lib/catalog';
import { cssFamily, familySpec, isItalic, loadPreview, weightOf } from '@/lib/fonts';
import { PASSAGES, type PassageId } from '@/lib/passages';
import { shareUrl } from '@/lib/share';
import { Sheet } from './Sheet';

const STROKE = 1.75;

/** The boldest upright style up to 700, for headings. Always one the font has. */
export function headingStyle(font: Font) {
  const upright = font.styles.filter((s) => !isItalic(s));
  if (!upright.length) return font.styles[0];
  const bold = upright.filter((s) => weightOf(s) <= 700);
  return bold.length ? bold[bold.length - 1] : upright[0];
}

export function bodyStyle(font: Font) {
  return font.styles.includes('400') ? '400' : font.styles.find((s) => !isItalic(s)) ?? font.styles[0];
}

function FontField({
  label,
  value,
  fonts,
  byFamily,
  onChange,
}: {
  label: string;
  value: Font;
  fonts: Font[];
  byFamily: Map<string, Font>;
  onChange: (font: Font) => void;
}) {
  const [text, setText] = useState(value.family);
  const listId = useId();
  useEffect(() => setText(value.family), [value]);

  const commit = (next: string) => {
    const match = byFamily.get(next) ?? fonts.find((f) => f.family.toLowerCase() === next.trim().toLowerCase());
    if (match) onChange(match);
    else setText(value.family);
  };

  return (
    <label className="pair-field">
      <span className="pair-field-label">{label}</span>
      <input
        list={listId}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (byFamily.has(e.target.value)) onChange(byFamily.get(e.target.value)!);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
      />
      <datalist id={listId}>
        {fonts.map((f) => (
          <option key={f.family} value={f.family} />
        ))}
      </datalist>
    </label>
  );
}

export function PairSheet({
  fonts,
  byFamily,
  initial,
  origin,
  onAdd,
  onClose,
}: {
  fonts: Font[];
  byFamily: Map<string, Font>;
  initial: [Font, Font];
  origin: string;
  onAdd: (heading: Font, body: Font) => void;
  onClose: () => void;
}) {
  const [heading, setHeading] = useState(initial[0]);
  const [body, setBody] = useState(initial[1]);
  const [passageId, setPassageId] = useState<PassageId>('ulysses');
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const passage = PASSAGES.find((p) => p.id === passageId)!;

  const hStyle = headingStyle(heading);
  const bStyle = bodyStyle(body);

  useEffect(() => {
    loadPreview(familySpec(heading, [hStyle]));
    loadPreview(familySpec(body, [bStyle]));
    setAdded(false);
  }, [heading, body, hStyle, bStyle]);

  return (
    <Sheet label="Pair fonts" onClose={onClose} wide>
      <div className="sheet-head">
        <div>
          <h2>Pair fonts</h2>
          <p className="muted">See a heading and body font set together.</p>
        </div>
        <button className="button plain done" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="pair-controls">
        <FontField label="Heading" value={heading} fonts={fonts} byFamily={byFamily} onChange={setHeading} />
        <button
          className="icon-button swap"
          type="button"
          aria-label="Swap heading and body fonts"
          title="Swap"
          onClick={() => {
            setHeading(body);
            setBody(heading);
          }}
        >
          <ArrowLeftRight size={16} strokeWidth={STROKE} aria-hidden />
        </button>
        <FontField label="Body" value={body} fonts={fonts} byFamily={byFamily} onChange={setBody} />
      </div>

      <div className="segmented small" role="tablist" aria-label="Passage">
        {PASSAGES.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === passageId} onClick={() => setPassageId(p.id)}>
            {p.title}
          </button>
        ))}
      </div>

      <article className="pair-preview">
        <h3
          style={{
            fontFamily: cssFamily(heading),
            fontWeight: weightOf(hStyle),
          }}
        >
          {passage.title}
        </h3>
        <p className="pair-byline" style={{ fontFamily: cssFamily(body) }}>
          {passage.byline}
        </p>
        <p className="pair-text" style={{ fontFamily: cssFamily(body), fontWeight: weightOf(bStyle) }}>
          {passage.text}
        </p>
      </article>

      <p className="muted pair-meta">
        {heading.family} {hStyle} · {body.family} {bStyle}
      </p>

      <div className="pair-actions">
        <button
          className="button primary"
          onClick={() => {
            onAdd(heading, body);
            setAdded(true);
          }}
        >
          {added ? <Check size={16} strokeWidth={STROKE} aria-hidden /> : <Plus size={16} strokeWidth={STROKE} aria-hidden />}
          {added ? 'Added to selection' : 'Add both to selection'}
        </button>
        <button
          className="button plain"
          onClick={() =>
            navigator.clipboard
              .writeText(shareUrl(origin, { pair: [heading.family, body.family] }))
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
          }
        >
          {copied ? <Check size={16} strokeWidth={STROKE} aria-hidden /> : <LinkIcon size={16} strokeWidth={STROKE} aria-hidden />}
          {copied ? 'Link copied' : 'Copy link to pairing'}
        </button>
      </div>
    </Sheet>
  );
}
