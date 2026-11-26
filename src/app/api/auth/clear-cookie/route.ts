import { NextResponse } from 'next/server';
import { sessionCookie, signedInHintCookie, staleHostOnlyCookie } from '@/lib/session-cookie';

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.headers.append('Set-Cookie', sessionCookie(request, '', 0));
  response.headers.append('Set-Cookie', signedInHintCookie(request, 0));
  const stale = staleHostOnlyCookie(request);
  if (stale) response.headers.append('Set-Cookie', stale);
  return response;
}
