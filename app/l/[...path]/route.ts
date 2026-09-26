import { proxyFile } from '@/lib/google';

// A few families are served from fonts.gstatic.com/l/font?kit=...
export function GET(request: Request) {
  return proxyFile(request);
}
