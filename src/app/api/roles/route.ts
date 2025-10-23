// app/api/roles/route.ts
import type { NextRequest } from 'next/server';
const api = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const withPerms = url.searchParams.get('withPerms') ?? 'false';
  const r = await fetch(`${api}/api/roles?withPerms=${withPerms}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    credentials: 'include',
    cache: 'no-store',
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export async function POST(req: NextRequest) {
  const r = await fetch(`${api}/api/roles`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: await req.text(),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

export const runtime = 'nodejs';
