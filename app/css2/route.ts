import { proxyCss } from '@/lib/google';

export function GET(request: Request) {
  return proxyCss('css2', request);
}
