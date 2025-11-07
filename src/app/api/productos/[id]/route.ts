import type { NextRequest } from 'next/server'

const apiBase = process.env.NEXT_PUBLIC_API_URL

type Params = { id: string }
type Context = { params: Promise<Params> }

export async function GET(req: NextRequest, context: Context) {
  const { id } = await context.params

  const res = await fetch(`${apiBase}/api/productos/${id}`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
  })

  const text = await res.text()
  const headers = new Headers()
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  headers.set('content-type', res.headers.get('content-type') ?? 'application/json')

  return new Response(text, { status: res.status, headers })
}

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params

  const body = await req.json().catch(() => ({}))

  const res = await fetch(`${apiBase}/api/productos/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const headers = new Headers()
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  headers.set('content-type', res.headers.get('content-type') ?? 'application/json')

  return new Response(text, { status: res.status, headers })
}

export async function DELETE(req: NextRequest, context: Context) {
  const { id } = await context.params

  const res = await fetch(`${apiBase}/api/productos/${id}`, {
    method: 'DELETE',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    credentials: 'include',
  })

  const text = await res.text()
  const headers = new Headers()
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) headers.set('set-cookie', setCookie)
  headers.set('content-type', res.headers.get('content-type') ?? 'application/json')

  return new Response(text, { status: res.status, headers })
}

export const runtime = 'nodejs'
