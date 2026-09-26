'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Font } from '@/lib/catalog';
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

const CATEGORIES = ['All', 'Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];
const SORTS = { popular: 'Popular', name: 'Name', newest: 'Newest' } as const;
const PAGE = 48;
const SELECTION_KEY = 'glyphyard:selection';

type Props = { fonts: Font[]; name: string; restricted: boolean; updated: string };

export function Picker({ fonts, name, restricted, updated }: Props) {
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

  useEffect(() => {
    setOrigin(window.location.origin);
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
    try {
      const saved = JSON.parse(localStorage.getItem(SELECTION_KEY) ?? '{}');
      if (saved && typeof saved === 'object') setSelection(saved);
    } catch {}
  }, []);

  const updateSelection = useCallback((next: Selection) => {
    setSelection(next);
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const byFamily = useMemo(() => new Map(fonts.map((f) => [f.family, f])), [fonts]);

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
  const styleCount = selectedFamilies.reduce((n, f) => n + selection[f].styles.length, 0);
  const host = origin.replace(/^https?:\/\//, '');

  return (
    <>
      <nav className="navbar">
        <div className="wrap navbar-inner">
          <a className="brand" href="/">
            <Logo />
            {name}
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
        </div>
      </div>

      <main className="wrap">
        <p className="count">
          {results.length.toLocaleString()} {results.length === 1 ? 'family' : 'families'}
        </p>
        <div className="grid">
          {results.slice(0, limit).map((font) => (
            <FontCard
              key={font.family}
              font={font}
              text={previewText}
              size={size}
              selected={selection[font.family]?.styles.length ?? 0}
              onOpen={() => setOpen(font)}
            />
          ))}
        </div>
        {results.length === 0 && <p className="empty">No fonts match those filters.</p>}
        <div ref={sentinel} aria-hidden />
        <footer className="footer">
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
          <button className="button primary" onClick={() => setEmbedOpen(true)}>
            Get embed code
          </button>
        </div>
      )}

      {open && (
        <StylesSheet
          font={open}
          text={previewText}
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

      {embedOpen && (
        <EmbedSheet
          origin={origin}
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
        {text || 'The quick brown fox jumps over the lazy dog'}
      </span>
    </button>
  );
}

function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="sheet-body">{children}</div>
    </dialog>
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
                  {text || 'Whereas recognition of the inherent dignity'}
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
  fonts,
  selection,
  onEdit,
  onRemove,
  onClose,
}: {
  origin: string;
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
