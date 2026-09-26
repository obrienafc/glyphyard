import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // Google Fonts' legacy path is /css; both it and /css2 are handled by route handlers.
};

export default config;
