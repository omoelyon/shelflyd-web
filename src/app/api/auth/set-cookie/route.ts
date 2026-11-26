import { NextResponse } from 'next/server';
import { sessionCookie, signedInHintCookie, staleHostOnlyCookie } from '@/lib/session-cookie';

export async function POST(request: Request) {
  const { token } = await request.json();

  const response = NextResponse.json({ ok: true });
  response.headers.append('Set-Cookie', sessionCookie(request, token, 60 * 60 * 24 * 7)); // 7 days
  response.headers.append('Set-Cookie', signedInHintCookie(request, 60 * 60 * 24 * 7));
  const stale = staleHostOnlyCookie(request);
  if (stale) response.headers.append('Set-Cookie', stale);
  return response;
}
