import { proxyCss } from '@/lib/google';

// Google Fonts' original (v1) API, kept so old embed codes keep working.
export function GET(request: Request) {
  return proxyCss('css', request);
}
