import type { NextRequest } from 'next/server'

const apiBase = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${apiBase}/api/admin/voice-assistant`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: req.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    const responseText = await res.text()

    return new Response(responseText, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in voice assistant API route:', error)
    return new Response(
      JSON.stringify({
        message: 'Error al procesar el comando',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }
}

export const runtime = 'nodejs'
