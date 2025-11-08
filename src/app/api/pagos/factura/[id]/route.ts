import type { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params
  const { id } = params

  const r = await fetch(`${api}/api/pagos/factura/${id}`, {
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    cache: 'no-store',
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' }
  })
}

export const runtime = 'nodejs'
