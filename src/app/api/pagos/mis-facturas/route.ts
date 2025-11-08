import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/'

    const response = await fetch(`${backendUrl}api/pagos/mis-facturas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cookie': request.headers.get('cookie') ?? '',
      },
      credentials: 'include',
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error en /api/pagos/mis-facturas:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
