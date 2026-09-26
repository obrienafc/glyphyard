'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Font } from '@/lib/catalog';
import { PairSheet, bodyStyle, headingStyle } from './PairSheet';
import { Sheet } from './Sheet';
import { ThemeToggle } from './ThemeToggle';
import {
  type Selection,
  cssFamily,
  cssUrl,
  defaultStyle,
  familySpec,
  isItalic,
  loadPreview,
  styleLabel,
  weightOf,
} from '@/lib/fonts';
import { QUOTES, type Quote, randomQuote } from '@/lib/quotes';
import { decodeSelection, shareUrl } from '@/lib/share';
import { Shuffle } from 'lucide-react';
import { SpillcheckBadge } from './SpillcheckBadge';

const CATEGORIES = ['All', 'Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];
const SORTS = { popular: 'Popular', name: 'Name', newest: 'Newest' } as const;
const PAGE = 48;
const SELECTION_KEY = 'glyphyard:selection';

type Props = {
  fonts: Font[];
  name: string;
  restricted: boolean;
  updated: string;
  /** Sites allowed to embed this instance's fonts, or null for any site. */
  embedOrigins: string[] | null;
  showBadge: boolean;
};

export function Picker({ fonts, name, restricted, updated, embedOrigins, showBadge }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [subset, setSubset] = useState('');
  const [sort, setSort] = useState<keyof typeof SORTS>('popular');
  const [previewText, setPreviewText] = useState('');
  const [size, setSize] = useState(36);
  const [limit, setLimit] = useState(PAGE);
  const [selection, setSelection] = useState<Selection>({});
  const [open, setOpen] = useState<Font | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [pair, setPair] = useState<[Font, Font] | null>(null);
  // The server renders the first quote; a random one is picked after mount.
  const [quote, setQuote] = useState<Quote>(QUOTES[0]);
  const sample = previewText || quote.text;

  const byFamily = useMemo(() => new Map(fonts.map((f) => [f.family, f])), [fonts]);

  useEffect(() => {
    setOrigin(window.location.origin);
    setQuote(randomQuote());
    // Shareable views: ?q=&category=&sort=&text=&size=
    const params = new URLSearchParams(window.location.search);
    const cat = CATEGORIES.find((c) => c.toLowerCase() === params.get('category')?.toLowerCase());
    if (cat) setCategory(cat);
    const s = params.get('sort');
    if (s && s in SORTS) setSort(s as keyof typeof SORTS);
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('text')) setPreviewText(params.get('text')!);
    const sz = Number(params.get('size'));
    if (sz >= 16 && sz <= 96) setSize(sz);
    // A shared link (?f=Inter:400,700) replaces the saved selection.
    const shared = decodeSelection(params.getAll('f'), byFamily);
    if (Object.keys(shared).length) {
      setSelection(shared);
      try {
        localStorage.setItem(SELECTION_KEY, JSON.stringify(shared));
      } catch {}
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(SELECTION_KEY) ?? '{}');
        if (saved && typeof saved === 'object') setSelection(saved);
      } catch {}
    }
    // ?pair=Heading|Body opens the pairing view.
    const [h, b] = (params.get('pair') ?? '').split('|').map((f) => byFamily.get(f));
    if (h && b) setPair([h, b]);
  }, [byFamily]);

  const updateSelection = useCallback((next: Selection) => {
    setSelection(next);
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify(next));
    } catch {}
  }, []);


  const subsets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of fonts) for (const s of f.subsets) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts.entries()].filter(([, n]) => n >= 5).map(([s]) => s).sort();
  }, [fonts]);

  const q = useDeferredValue(query.trim().toLowerCase());
  const results = useMemo(() => {
    const list = fonts.filter(
      (f) =>
        (category === 'All' || f.category === category) &&
        (!subset || f.subsets.includes(subset)) &&
        (!q || f.family.toLowerCase().includes(q)),
    );
    if (sort === 'name') list.sort((a, b) => a.family.localeCompare(b.family));
    else if (sort === 'newest') list.sort((a, b) => b.added.localeCompare(a.added));
    else list.sort((a, b) => a.popularity - b.popularity);
    return list;
  }, [fonts, category, subset, q, sort]);

  useEffect(() => setLimit(PAGE), [category, subset, q, sort]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setLimit((l) => l + PAGE),
      { rootMargin: '1200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const selectedFamilies = Object.keys(selection).filter((f) => byFamily.has(f));

  const openPair = () => {
    const picked = selectedFamilies.map((f) => byFamily.get(f)!);
    const fallback = ['Playfair Display', 'Inter', 'Lora', 'Roboto']
      .map((f) => byFamily.get(f))
      .filter((f): f is Font => !!f);
    const pool = [...picked, ...fallback, ...fonts].filter((f, i, all) => all.indexOf(f) === i);
    if (pool.length >= 2) setPair([pool[0], pool[1]]);
  };

  const addPair = (heading: Font, body: Font) => {
    const next = { ...selection };
    const add = (font: Font, style: string) => {
      const current = next[font.family];
      next[font.family] = current
        ? { ...current, styles: current.styles.includes(style) ? current.styles : [...current.styles, style] }
        : { styles: [style], variable: false };
    };
    add(heading, headingStyle(heading));
    add(body, bodyStyle(body));
    updateSelection(next);
  };
  const styleCount = selectedFamilies.reduce((n, f) => n + selection[f].styles.length, 0);
  const host = origin.replace(/^https?:\/\//, '');

  return (
    <>
      <nav className="navbar">
        <div className="wrap navbar-inner">
          <a className="brand" href="/">
            <Logo />
            <span className="brand-name">{name}</span>
          </a>
          <label className="search">
            <SearchIcon />
            <span className="visually-hidden">Search fonts</span>
            <input
              type="search"
              placeholder="Search fonts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ThemeToggle />
          <a
            className="github-link"
            href="https://github.com/obrienafc/glyphyard"
            target="_blank"
            rel="noreferrer"
            aria-label="Glyphyard on GitHub"
            title="Glyphyard on GitHub"
          >
            <GitHubMark />
          </a>
        </div>
      </nav>

      <header className="hero wrap">
        <h1>
          Every font you need.
          <br />
          <span className="hero-soft">Served from your own domain.</span>
        </h1>
        <p className="hero-sub">
          {fonts.length.toLocaleString()} {restricted ? 'hand-picked' : 'open-source'} font families
          on <strong>{host || 'your domain'}</strong>. No requests to Google, no tracking, no
          cookies.
        </p>
      </header>

      <div className="controls wrap">
        <div className="segmented" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button key={c} role="radio" aria-checked={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="controls-row">
          <input
            className="field preview-input"
            type="text"
            placeholder="Type something to preview…"
            aria-label="Preview text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />
          <label className="size">
            <span className="visually-hidden">Preview size</span>
            <span className="size-a small" aria-hidden>
              A
            </span>
            <input
              type="range"
              min={16}
              max={96}
              value={size}
              onChange={(e) => setSize(+e.target.value)}
            />
            <span className="size-a" aria-hidden>
              A
            </span>
          </label>
          <select
            className="field"
            aria-label="Language"
            value={subset}
            onChange={(e) => setSubset(e.target.value)}
          >
            <option value="">All languages</option>
            {subsets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button type="button" className="field pair-open" onClick={openPair}>
            Pair fonts
          </button>
        </div>
      </div>

      <main className="wrap">
        <div className="count-row">
          <p className="count">
            {results.length.toLocaleString()} {results.length === 1 ? 'family' : 'families'}
          </p>
          {!previewText && (
            <p className="quote-credit">
              <span>{quote.source}</span>
              <button
                type="button"
                className="shuffle"
                onClick={() => setQuote((q) => randomQuote(q))}
                aria-label="Show a different quote"
                title="Show a different quote"
              >
                <Shuffle size={14} strokeWidth={1.75} aria-hidden />
                Shuffle
              </button>
            </p>
          )}
        </div>
        <div className="grid">
          {results.slice(0, limit).map((font) => (
            <FontCard
              key={font.family}
              font={font}
              text={sample}
              size={size}
              selected={selection[font.family]?.styles.length ?? 0}
              onOpen={() => setOpen(font)}
            />
          ))}
        </div>
        {results.length === 0 && <p className="empty">No fonts match those filters.</p>}
        <div ref={sentinel} aria-hidden />
        <footer className="footer">
          <p className="credit">
            Built by{' '}
            <a href="https://patrickob.tech" target="_blank" rel="noreferrer">
              Patrick O’Brien
            </a>
          </p>
          <p>
            Fonts are licensed by their authors.{' '}
            <a href="https://fonts.google.com/attribution" target="_blank" rel="noreferrer">
              Attribution
            </a>
            {' · '}Catalog updated {new Date(updated).toLocaleDateString()}
            {' · '}
            <a href="https://github.com/obrienafc/glyphyard" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </p>
          {embedOrigins && (
            <p>
              This is a public demo: its fonts only load on {embedOrigins.join(', ')}.{' '}
              <a href="https://github.com/obrienafc/glyphyard#deploy" target="_blank" rel="noreferrer">
                Deploy your own
              </a>{' '}
              to use it on any site.
            </p>
          )}
          {showBadge && <SpillcheckBadge />}
        </footer>
      </main>

      {selectedFamilies.length > 0 && (
        <div className="tray" role="region" aria-label="Selected fonts">
          <span className="tray-count">
            <strong>{selectedFamilies.length}</strong>{' '}
            {selectedFamilies.length === 1 ? 'family' : 'families'}
            <span className="tray-styles">
              {' '}
              · {styleCount} {styleCount === 1 ? 'style' : 'styles'}
            </span>
          </span>
          <button className="button plain" onClick={() => updateSelection({})}>
            Clear
          </button>
          <button className="button plain tray-pair" onClick={openPair}>
            Pair
          </button>
          <button className="button primary" onClick={() => setEmbedOpen(true)}>
            Get embed code
          </button>
        </div>
      )}

      {open && (
        <StylesSheet
          font={open}
          text={sample}
          value={selection[open.family]}
          onChange={(v) => {
            const next = { ...selection };
            if (v.styles.length) next[open.family] = v;
            else delete next[open.family];
            updateSelection(next);
          }}
          onClose={() => setOpen(null)}
        />
      )}

      {pair && (
        <PairSheet
          fonts={fonts}
          byFamily={byFamily}
          initial={pair}
          origin={origin}
          onAdd={addPair}
          onClose={() => setPair(null)}
        />
      )}

      {embedOpen && (
        <EmbedSheet
          origin={origin}
          embedOrigins={embedOrigins}
          fonts={selectedFamilies.map((f) => byFamily.get(f)!)}
          selection={selection}
          onEdit={(font) => {
            setEmbedOpen(false);
            setOpen(font);
          }}
          onRemove={(family) => {
            const next = { ...selection };
            delete next[family];
            updateSelection(next);
            if (Object.keys(next).length === 0) setEmbedOpen(false);
          }}
          onClose={() => setEmbedOpen(false)}
        />
      )}
    </>
  );
}

function usePreview(font: Font, styles: string[], active: boolean) {
  const [ready, setReady] = useState(false);
  const spec = familySpec(font, styles);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const style = styles[0];
    loadPreview(spec)
      .then(() =>
        document.fonts.load(
          `${isItalic(style) ? 'italic ' : ''}${weightOf(style)} 16px ${cssFamily(font)}`,
        ),
      )
      .catch(() => {})
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
    // spec captures font + styles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, active]);
  return ready;
}

function FontCard({
  font,
  text,
  size,
  selected,
  onOpen,
}: {
  font: Font;
  text: string;
  size: number;
  selected: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const style = defaultStyle(font);
  const ready = usePreview(font, [style], visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button ref={ref} className="card" data-selected={selected > 0} onClick={onOpen}>
      <span className="card-head">
        <span className="card-name">{font.family}</span>
        <span className="card-check" aria-label={selected ? `${selected} selected` : undefined}>
          {selected > 0 ? selected : '+'}
        </span>
      </span>
      <span className="card-meta">
        {font.category} · {font.styles.length} {font.styles.length === 1 ? 'style' : 'styles'}
        {font.variable && <span className="badge">Variable</span>}
      </span>
      <span
        className="card-preview"
        data-ready={ready}
        style={{
          fontFamily: cssFamily(font),
          fontSize: size,
          fontWeight: weightOf(style),
          fontStyle: isItalic(style) ? 'italic' : 'normal',
        }}
      >
        {text}
      </span>
    </button>
  );
}

function StylesSheet({
  font,
  text,
  value,
  onChange,
  onClose,
}: {
  font: Font;
  text: string;
  value?: Selection[string];
  onChange: (v: Selection[string]) => void;
  onClose: () => void;
}) {
  const styles = value?.styles ?? [];
  const variable = value?.variable ?? false;
  const ready = usePreview(font, font.styles, true);

  const toggle = (s: string) =>
    onChange({
      variable,
      styles: styles.includes(s) ? styles.filter((x) => x !== s) : [...styles, s],
    });

  return (
    <Sheet label={font.family} onClose={onClose}>
      <div className="sheet-head">
        <div>
          <h2>{font.family}</h2>
          <p className="muted">
            {font.category} · {font.styles.length} {font.styles.length === 1 ? 'style' : 'styles'}
            {font.variable && ` · variable weight ${font.variable[0]}–${font.variable[1]}`}
          </p>
        </div>
        <button className="button plain done" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="sheet-actions">
        <button className="button small" onClick={() => onChange({ variable, styles: font.styles })}>
          Select all
        </button>
        <button className="button small" onClick={() => onChange({ variable, styles: [] })}>
          Clear
        </button>
        {font.variable && (
          <label className="check" title="Embed the whole weight range as one variable font">
            <input
              type="checkbox"
              checked={variable}
              onChange={(e) =>
                onChange({
                  variable: e.target.checked,
                  styles: styles.length ? styles : [defaultStyle(font)],
                })
              }
            />
            Full variable range
          </label>
        )}
      </div>

      <ul className="styles" data-ready={ready}>
        {font.styles.map((s) => {
          const on = styles.includes(s);
          return (
            <li key={s}>
              <button className="style-row" aria-pressed={on} onClick={() => toggle(s)}>
                <span className="style-label">{styleLabel(s)}</span>
                <span
                  className="style-sample"
                  style={{
                    fontFamily: cssFamily(font),
                    fontWeight: weightOf(s),
                    fontStyle: isItalic(s) ? 'italic' : 'normal',
                  }}
                >
                  {text}
                </span>
                <span className="style-toggle" aria-hidden>
                  {on ? <CheckIcon /> : '+'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function EmbedSheet({
  origin,
  embedOrigins,
  fonts,
  selection,
  onEdit,
  onRemove,
  onClose,
}: {
  origin: string;
  embedOrigins: string[] | null;
  fonts: Font[];
  selection: Selection;
  onEdit: (font: Font) => void;
  onRemove: (family: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'link' | 'import'>('link');
  const url = cssUrl(
    origin,
    fonts.map((f) => familySpec(f, selection[f.family].styles, selection[f.family].variable)),
  );
  const code =
    mode === 'link'
      ? `<link rel="preconnect" href="${origin}">\n<link href="${url}" rel="stylesheet">`
      : `<style>\n@import url('${url}');\n</style>`;

  return (
    <Sheet label="Embed code" onClose={onClose}>
      <div className="sheet-head">
        <h2>Embed code</h2>
        <button className="button plain done" onClick={onClose}>
          Done
        </button>
      </div>

      <ShareButton url={shareUrl(origin, { selection })} />

      {embedOrigins && (
        <p className="muted small-print demo-note">
          This demo only serves fonts to {embedOrigins.join(', ')}. For other sites,{' '}
          <a href="https://github.com/obrienafc/glyphyard#deploy" target="_blank" rel="noreferrer">
            deploy your own Glyphyard
          </a>
          .
        </p>
      )}

      <div className="segmented small" role="tablist">
        <button role="tab" aria-selected={mode === 'link'} onClick={() => setMode('link')}>
          &lt;link&gt;
        </button>
        <button role="tab" aria-selected={mode === 'import'} onClick={() => setMode('import')}>
          @import
        </button>
      </div>
      <Code value={code} />

      <h3>CSS rules</h3>
      <Code value={fonts.map((f) => `font-family: ${cssFamily(f)};`).join('\n')} />

      <h3>Selected</h3>
      <ul className="selected-list">
        {fonts.map((f) => {
          const v = selection[f.family];
          return (
            <li key={f.family}>
              <div>
                <strong>{f.family}</strong>
                <span className="muted">
                  {v.variable && f.variable
                    ? `Variable ${f.variable[0]}–${f.variable[1]}${v.styles.some(isItalic) ? ' + italic' : ''}`
                    : v.styles.map(styleLabel).join(', ')}
                </span>
              </div>
              <div className="selected-actions">
                <button className="button small" onClick={() => onEdit(f)}>
                  Edit
                </button>
                <button className="button small" onClick={() => onRemove(f.family)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="muted small-print">
        Migrating from Google Fonts? Replace <code>fonts.googleapis.com</code> with{' '}
        <code>{origin.replace(/^https?:\/\//, '')}</code> in your existing embed code.
      </p>
    </Sheet>
  );
}

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="button plain share-button"
      onClick={() =>
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? 'Link copied' : 'Copy link to this selection'}
    </button>
  );
}

function Code({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code">
      <pre>{value}</pre>
      <button
        className="button small"
        onClick={() => {
          navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 28 28" aria-hidden>
      <rect width="28" height="28" rx="7" fill="currentColor" />
      <text x="14" y="20" textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--bg)" fontFamily="Georgia, serif">
        g
      </text>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
      <circle cx="7" cy="7" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** GitHub's mark (Octicons, MIT). Brand logos are the one exception to the Lucide icon set. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}
