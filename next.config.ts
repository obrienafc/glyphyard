import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Send only our origin as the referrer, so font requests from the
        // picker share CDN cache entries instead of varying by page URL.
        source: '/',
        headers: [{ key: 'Referrer-Policy', value: 'strict-origin' }],
      },
    ];
  },
};

export default config;
