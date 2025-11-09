import type { NextRequest } from 'next/server'

const api = process.env.NEXT_PUBLIC_API_URL

type Params = { id: string }
type Context = { params: Params } | { params: Promise<Params> }

const resolveParams = async (context: Context): Promise<Params> =>
  context.params instanceof Promise ? await context.params : context.params

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await resolveParams(context)
  const body = await req.json().catch(() => ({}))

  const r = await fetch(`${api}/api/ordenes/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  return new Response(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
  })
}

export const runtime = 'nodejs'
