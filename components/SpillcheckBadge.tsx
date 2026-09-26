'use client';

import { useEffect, useState } from 'react';

const SPILLCHECK = 'https://spillcheck.patrickob.tech';

/** Privacy grade for this instance, from Spillcheck. Opt-in: it's a request to another server. */
export function SpillcheckBadge() {
  const [host, setHost] = useState('');
  useEffect(() => setHost(window.location.host), []);
  if (!host) return null;
  const q = encodeURIComponent(host);
  return (
    <a className="footer-badge" href={`${SPILLCHECK}/?url=${q}`} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${SPILLCHECK}/badge?url=${q}`} alt={`Spillcheck privacy grade for ${host}`} height={20} />
    </a>
  );
}
