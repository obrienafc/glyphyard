'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import type { Font } from '@/lib/catalog';
import { buildStaticZip } from '@/lib/static-download';

type State =
  | { status: 'idle' }
  | { status: 'working'; done: number; total: number }
  | { status: 'done'; bytes: number; files: number }
  | { status: 'error'; message: string };

const mb = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function StaticDownload({ specs, fonts, sample }: { specs: string[]; fonts: Font[]; sample: string }) {
  const [state, setState] = useState<State>({ status: 'idle' });

  const start = async () => {
    setState({ status: 'working', done: 0, total: 0 });
    try {
      const { blob, bytes, files } = await buildStaticZip(specs, fonts, sample, (p) =>
        setState({ status: 'working', ...p }),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glyphyard-fonts.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState({ status: 'done', bytes, files });
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message || 'The download failed.' });
    }
  };

  return (
    <div className="static-download">
      <button className="button small" onClick={start} disabled={state.status === 'working'}>
        <Download size={16} strokeWidth={1.75} aria-hidden />
        {state.status === 'working' ? 'Preparing…' : 'Download .zip'}
      </button>
      <p className="muted" role="status" aria-live="polite">
        {state.status === 'idle' && 'Font files, fonts.css, an example page and a README.'}
        {state.status === 'working' &&
          (state.total ? `Downloading ${state.done} of ${state.total} files…` : 'Fetching the stylesheet…')}
        {state.status === 'done' && `Downloaded ${state.files} files (${mb(state.bytes)}).`}
        {state.status === 'error' && state.message}
      </p>
    </div>
  );
}
