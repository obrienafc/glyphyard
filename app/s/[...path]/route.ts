import { proxyFile } from '@/lib/google';

// Font files, mirrored from fonts.gstatic.com/s/...
export function GET(request: Request) {
  return proxyFile(request);
}
