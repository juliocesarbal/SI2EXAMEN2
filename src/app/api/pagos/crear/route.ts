import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/'

    const response = await fetch(`${backendUrl}api/pagos/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error en /api/pagos/crear:', error)
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 })
  }
}
